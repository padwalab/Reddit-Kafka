import Invite from "../models/Invite.js";
import Community from "../models/Community.js";
import User from "../models/User.js";
import mongoose from "mongoose";

import { inviteResProducer } from "../kafka/producers/inviteResProducer.js";
import { inviteReqConsumer } from "../kafka/consumers/inviteReqConsumer.js";

// userConsumer.start();
inviteResProducer.connect();

export let inviteHandler = {};

// @route POST api/invites/userInvite
// @desc Invite user
// @access Public
inviteHandler.inviteUser = async (id, params, body, user) => {
  console.log("body", JSON.stringify(body));
  const { communityId, userIds, date } = body;
  const resultPromises = userIds.map(async (userId) => {
    let obj = await Community.find({
      _id: communityId,
      subscribers: mongoose.Types.ObjectId(userId),
    });
    if (obj.length > 0) {
      return {
        id: userId,
        message: `User is already part of the community.`,
      };
    } else {
      const findInvite = await Invite.findOne({ communityId, userId });
      if (findInvite) {
        return {
          id: userId,
          message: `Invite is already sent to the user.`,
        };
      } else {
        const invite = new Invite({ communityId, userId, date });
        invite.save();
        return {
          id: userId,
          message: `Invite sent to user.`,
        };
      }
    }
  });
  const result = await Promise.all(resultPromises);
  inviteResProducer.send({
    topic: "invite_response",
    messages: [
      {
        value: JSON.stringify({
          id,
          status: 200,
          data: result,
        }),
      },
    ],
  });
  // res.json(result);
};

// @route GET api/invites/communityInvites
// @desc List of invites sent by community moderator to users
// @access Public
inviteHandler.loadCommunityInvites = async (id, params, body, user) => {
  const { communityId } = params;

  let invites = await Invite.find({ communityId }).populate({
    path: "userId",
    select: ["firstName", "lastName"],
  });
  inviteResProducer.send({
    topic: "invite_response",
    messages: [
      {
        value: JSON.stringify({
          id,
          status: 200,
          data: invites,
        }),
      },
    ],
  });
  // return res.status(`200`).send(invites);
};

// @route GET api/invites/userInvites
// @desc List of invites received by user
// @access Public
inviteHandler.loadUserInvites = async (id, params, body, user) => {
  let invites = await Invite.find({ userId: user.id }).populate({
    path: "communityId",
    select: ["communityName"],
  });
  inviteResProducer.send({
    topic: "invite_response",
    messages: [
      {
        value: JSON.stringify({
          id,
          status: 200,
          data: invites,
        }),
      },
    ],
  });
  // return res.status(`200`).send(invites);
};

// @route DELETE api/invites/inviteAction
// @desc Accept/Reject for an invite
// @access Public
inviteHandler.inviteAction = async (id, params, body, user) => {
  const { communityId, status } = body;
  let msg;

  //delete the invite
  await Invite.deleteOne({ userId: user.id, communityId });
  if (status === "Accept") {
    let obj = await Community.findByIdAndUpdate(
      communityId,
      { $addToSet: { subscribers: user.id } },
      { new: true }
    );
    await User.findByIdAndUpdate(
      user.id,
      { $addToSet: { communities: communityId } },
      { new: true }
    );
    if (obj) {
      msg = obj;
    }
  }
  if (status === "Reject") {
    msg = "User rejected";
  }
  inviteResProducer.send({
    topic: "invite_response",
    messages: [
      {
        value: JSON.stringify({
          id,
          status: 200,
          data: msg,
        }),
      },
    ],
  });
  // return res.status(`200`).send(msg);
};
