import dotenv from "dotenv";
import Community from "../models/Community.js";
import { sqlDB } from "../config/queries.js";
import { findFor } from "../../utils/createNestedObject.js";
import _ from "lodash";

import { communityHomeResProducer } from "../kafka/producers/communityHomeResProducer.js";
import { communityHomeReqConsumer } from "../kafka/consumers/communityHomeReqConsumer.js";

// userConsumer.start();
communityHomeResProducer.connect();

dotenv.config({ path: ".env" });

export const getPosts = async (communityID, communityName, userId) => {
  const allPosts = await sqlDB.getAllPosts(communityID);

  const z = {};
  const nestedObject = allPosts.map(async (post) => {
    let obj = new Object();
    obj["post"] = post;
    obj.post["postVotes"] = await sqlDB.getPostVoteCount(post.id, userId);
    const rcs = await sqlDB.getRootCommentIds(communityID, post.id);

    if (rcs.length) {
      const promiseComments = rcs.map(async (e) => {
        obj.post[`cv_${e.id}`] = await sqlDB.getCommentVoteCount(e.id, userId);
        return await sqlDB.getAllComments(e.id);
      });
      const allComments = await Promise.all(promiseComments);
      obj.post["numberOfComments"] = allComments.flat(1).length;

      const promiseSeq = rcs.map(async (e) => await sqlDB.getSequences(e.id));
      const allSeq = await Promise.all(promiseSeq);

      const childParent = allSeq.flat(1).map((e) => {
        const p = e.seq.split(",");
        return {
          pid: e.postId,
          id: e.id,
          parent: parseInt(p[p.length - 2]) || null,
        };
      });
      const groupedChildParentByPostId = _.mapValues(
        _.groupBy(childParent, "pid"),
        (cplist) => cplist.map((cp) => _.omit(cp, "pid"))
      );
      const groupedCommentsByPostId = _.mapValues(
        _.groupBy(allComments.flat(1), "postId"),
        (clist) => clist.map((comment) => _.omit(comment, "postId"))
      );

      obj.post["comments"] = findFor(
        null,
        groupedChildParentByPostId[post.id],
        groupedCommentsByPostId[post.id]
      );
    }
    return obj;
  });

  z[communityName] = await Promise.all(nestedObject);
  return z;
};

export let communityHomeHandler = {};

// @route POST api/community-home/join-community
// @desc get list of communities and requests to join
// @access Private
communityHomeHandler.requestToJOin = async (id, params, body, user) => {
  const { communityId } = body;
  try {
    await Community.findByIdAndUpdate(communityId, {
      $addToSet: { joinRequests: user.id },
    });

    communityHomeResProducer.send({
      topic: "commhome_response",
      messages: [
        {
          value: JSON.stringify({
            id,
            status: 200,
            data: "join request sent",
          }),
        },
      ],
    });
    // res.json("join request sent");
  } catch (error) {
    console.log(error);
    communityHomeResProducer.send({
      topic: "commhome_response",
      messages: [
        {
          value: JSON.stringify({
            id,
            status: 500,
            data: "Server error",
          }),
        },
      ],
    });
    // res.status(500).send("Server error");
  }
};

// @route GET api/community-home/:communityId
// @desc get community details
// @access Private
communityHomeHandler.getCommunityInfo = async (id, params, body, user) => {
  try {
    const myCommunity = await Community.findById(params.communityId);
    console.log(myCommunity.communityName);
    const sub = myCommunity.subscribers.includes(user.id);
    let buttonDisplay;
    if (sub) {
      buttonDisplay = "Leave";
    } else {
      const join = myCommunity.joinRequests.includes(user.id);
      if (join) {
        buttonDisplay = "Waiting For Approval";
      } else {
        buttonDisplay = "Join";
      }
    }
    const posts = await getPosts(
      params.communityId,
      myCommunity.communityName,
      user.id
    );

    communityHomeResProducer.send({
      topic: "commhome_response",
      messages: [
        {
          value: JSON.stringify({
            id,
            status: 200,
            data: {
              id: myCommunity.id,
              communityName: myCommunity.communityName,
              description: myCommunity.description,
              postsCount: myCommunity.posts.length,
              createdDate: myCommunity.createdDate,
              subscribersCount: myCommunity.subscribers.length,
              images: myCommunity.images,
              upvotes: myCommunity.upvotes.length,
              downvotes: myCommunity.downvotes.length,
              rules: myCommunity.rules,
              buttonDisplay,
              posts,
            },
          }),
        },
      ],
    });

    // res.json({
    //   id: myCommunity.id,
    //   communityName: myCommunity.communityName,
    //   description: myCommunity.description,
    //   postsCount: myCommunity.posts.length,
    //   createdDate: myCommunity.createdDate,
    //   subscribersCount: myCommunity.subscribers.length,
    //   images: myCommunity.images,
    //   upvotes: myCommunity.upvotes.length,
    //   downvotes: myCommunity.downvotes.length,
    //   rules: myCommunity.rules,
    //   buttonDisplay,
    //   posts,
    // });
  } catch (error) {
    console.log(error);
    communityHomeResProducer.send({
      topic: "commhome_response",
      messages: [
        {
          value: JSON.stringify({
            id,
            status: 500,
            data: "Server error",
          }),
        },
      ],
    });
    // res.status(500).send("Server error");
  }
};

// @route DELETE api/community-home/
// @desc Leave community
// @access Private
communityHomeHandler.leaveCommunity = async (id, params, body, user) => {
  const { communityId } = body;
  try {
    await Community.findByIdAndUpdate(communityId, {
      $pull: { subscribers: user.id },
    });

    communityHomeResProducer.send({
      topic: "commhome_response",
      messages: [
        {
          value: JSON.stringify({
            id,
            status: 200,
            data: "left from community",
          }),
        },
      ],
    });
    // res.json("left from community");
  } catch (error) {
    console.log(error);
    communityHomeResProducer.send({
      topic: "commhome_response",
      messages: [
        {
          value: JSON.stringify({
            id,
            status: 500,
            data: "Server error",
          }),
        },
      ],
    });
    // res.status(500).send("Server error");
  }
};
