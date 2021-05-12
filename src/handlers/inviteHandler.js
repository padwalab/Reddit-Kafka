import Invite from "../models/Invite.js";
import Community from "../models/Community.js";

import { inviteResProducer } from "../kafka/producers/inviteResProducer.js";
import { inviteReqConsumer } from "../kafka/consumers/inviteReqConsumer.js";

// userConsumer.start();
inviteResProducer.connect();

export let inviteHandler = {};

// @route POST api/invites/userInvite
// @desc Invite user
// @access Public
inviteHandler.inviteUser = async (id, params, body, user) => {
  const { communityId, userId, date } = body;

  let invite = await Invite.findOne({ communityId, userId });

  if (invite) {
    inviteResProducer.send({
      topic: "invite_response",
      messages: [
        {
          value: JSON.stringify({
            id,
            status: 400,
            data: {
              errors: [{ msg: `Invite is already sent to the user.` }],
            },
          }),
        },
      ],
    });
    // return res.status(400).json({
    //   errors: [{ msg: `Invite is already sent to the user.` }],
    // });
  }
  invite = new Invite({ communityId, userId, date });
  invite.save();
  inviteResProducer.send({
    topic: "invite_response",
    messages: [
      {
        value: JSON.stringify({
          id,
          status: 200,
          data: invite,
        }),
      },
    ],
  });
  // res.json(invite);
};

// @route GET api/invites/communityInvites
// @desc List of invites sent by community moderator to users
// @access Public
inviteHandler.loadCommunityInvites = async (id, params, body, user) => {
  const { communityId } = body;

  let invites = await Invite.find({ communityId });
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
  let invites = await Invite.find({ userId: user.id });
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
