import dotenv from 'dotenv';
import Community from '../models/Community.js';
import { sqlDB } from '../config/queries.js';
import User from '../models/User.js';
dotenv.config({ path: '.env' });

import { moderationResProducer } from '../kafka/producers/moderationResProducer.js';
import { moderationReqConsumer } from '../kafka/consumers/moderationReqConsumer.js';

// userConsumer.start();
moderationResProducer.connect();

export let moderationHandler = {};

// @route GET api/moderator/
// @desc get list of communities and requests to join
// @access Private
moderationHandler.getListOfCommunities = async (id, params, body, user) => {
  try {
    const myCommunities = await Community.find(
      { creatorID: user.id },
      { communityName: 1, joinRequests: 1, subscribers: 1 }
    ).populate({
      path: 'joinRequests subscribers',
      select: [
        'firstName',
        'lastName',
        'email',
        'profilePicture',
        'gender',
        'aboutMe',
        'communities',
      ],
      populate: {
        path: 'communities',
        select: ['communityName'],
      },
    });

    const communityInfo = myCommunities.map((community) => {
      return {
        communityId: community.id,
        communityName: community.communityName,
        noOfJoinReqs: community.joinRequests.length,
        joinReqs: community.joinRequests,
        subscribers: community.subscribers,
      };
    });

    moderationResProducer.send({
      topic: 'moderation_response',
      messages: [
        {
          value: JSON.stringify({
            id,
            status: 200,
            data: communityInfo,
          }),
        },
      ],
    });
    // res.json(communityInfo);
  } catch (error) {
    console.log(error);
    moderationResProducer.send({
      topic: 'invite_response',
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

// @route POST api/moderator/
// @desc accept join requests
// @access Private
moderationHandler.acceptJoinReqs = async (id, params, body, user) => {
  try {
    const { communityId, userList } = body;
    await Community.findByIdAndUpdate(communityId, {
      $addToSet: { subscribers: { $each: userList } },
      $pull: { joinRequests: { $in: userList } },
    });

    await User.updateMany(
      { _id: { $in: userList } },
      {
        $addToSet: { communities: communityId },
      }
    );
    moderationResProducer.send({
      topic: 'moderation_response',
      messages: [
        {
          value: JSON.stringify({
            id,
            status: 200,
            data: 'join requests accepted',
          }),
        },
      ],
    });
    // res.json("join requests accepted");
  } catch (error) {
    console.log(error);
    moderationResProducer.send({
      topic: 'moderation_response',
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

// @route DELETE api/moderator/
// @desc delete user from list of communities
// @access Private
moderationHandler.deleteUserFromCommunities = async (
  id,
  params,
  body,
  user
) => {
  try {
    const { userID, communityList } = body;
    await User.findByIdAndUpdate(userID, {
      $pull: { communities: { $in: communityList } },
    });
    await Community.updateMany(
      { _id: { $in: communityList } },
      {
        $pull: { subscribers: userID },
      }
    );

    await sqlDB.deletePostBycreatorID(userID, communityList);
    const ids = await sqlDB.getAllPostsFromCommList(communityList);
    const id_list = ids.map((ele) => ele.id);
    await sqlDB.deleteCommentsByUserId(userID, id_list);

    moderationResProducer.send({
      topic: 'moderation_response',
      messages: [
        {
          value: JSON.stringify({
            id,
            status: 200,
            data: 'user removed from selected communities',
          }),
        },
      ],
    });
    // res.json("user removed from selected communities");
  } catch (error) {
    console.log(error);
    moderationResProducer.send({
      topic: 'moderation_response',
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
