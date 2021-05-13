import dotenv from 'dotenv';
import Community from '../models/Community.js';
import { sqlDB } from '../config/queries.js';

import _ from 'lodash';

import { communityHomeResProducer } from '../kafka/producers/communityHomeResProducer.js';
import { communityHomeReqConsumer } from '../kafka/consumers/communityHomeReqConsumer.js';

// userConsumer.start();
communityHomeResProducer.connect();

dotenv.config({ path: '.env' });

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
      topic: 'commhome_response',
      messages: [
        {
          value: JSON.stringify({
            id,
            status: 200,
            data: 'join request sent',
          }),
        },
      ],
    });
    // res.json("join request sent");
  } catch (error) {
    console.log(error);
    communityHomeResProducer.send({
      topic: 'commhome_response',
      messages: [
        {
          value: JSON.stringify({
            id,
            status: 500,
            data: 'Server error',
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
    const myCommunity = await Community.findById(params.communityId).populate({
      path: 'creatorID',
      select: ['firstName'],
    });
    let buttonDisplay = '';

    if (
      params.userId !== 'null' &&
      String(myCommunity.creatorID.id) !== params.userId
    ) {
      console.log('here');
      const sub = myCommunity.subscribers.includes(params.userId);

      if (sub) {
        buttonDisplay = 'Leave';
      } else {
        const join = myCommunity.joinRequests.includes(params.userId);
        if (join) {
          buttonDisplay = 'Waiting For Approval';
        } else {
          buttonDisplay = 'Join';
        }
      }
    }
    const posts = await sqlDB.getAllPosts(params.communityId);
    const nestedObject = posts.map(async (post) => {
      let obj = new Object();
      obj['post'] = post;
      obj.post['postVotes'] = await sqlDB.getPostVoteCount(
        post.id,
        params.userId
      );
      return obj;
    });
    const allPosts = await Promise.all(nestedObject);

    communityHomeResProducer.send({
      topic: 'commhome_response',
      messages: [
        {
          value: JSON.stringify({
            id,
            status: 200,
            data: {
              id: myCommunity.id,
              communityName: myCommunity.communityName,
              creatorName: myCommunity.creatorID.firstName,
              description: myCommunity.description,
              postsCount: myCommunity.posts.length,
              createdDate: myCommunity.createdDate,
              subscribersCount: myCommunity.subscribers.length,
              images: myCommunity.images,
              upvotes: myCommunity.upvotes.length,
              downvotes: myCommunity.downvotes.length,
              rules: myCommunity.rules,
              buttonDisplay,
              posts: allPosts,
            },
          }),
        },
      ],
    });
  } catch (error) {
    console.log(error);
    communityHomeResProducer.send({
      topic: 'commhome_response',
      messages: [
        {
          value: JSON.stringify({
            id,
            status: 500,
            data: 'Server error',
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
    await User.findByIdAndUpdate(user.id, {
      $pull: { communities: communityId },
    });
    communityHomeResProducer.send({
      topic: 'commhome_response',
      messages: [
        {
          value: JSON.stringify({
            id,
            status: 200,
            data: 'left from community',
          }),
        },
      ],
    });
    // res.json("left from community");
  } catch (error) {
    console.log(error);
    communityHomeResProducer.send({
      topic: 'commhome_response',
      messages: [
        {
          value: JSON.stringify({
            id,
            status: 500,
            data: 'Server error',
          }),
        },
      ],
    });
    // res.status(500).send("Server error");
  }
};
