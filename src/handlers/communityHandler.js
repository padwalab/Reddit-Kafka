import { communityReqConsumer } from "../kafka/consumers/communityReqConsumer.js";
import { communityResProducer } from "../kafka/producers/communityResProducer.js";
import { sqlDB } from "../config/queries.js";
import Community from "../models/Community.js";
import dotenv from "dotenv";
import User from "../models/User.js";
import { S3 } from "../config/s3.js";
import uuid from "uuid";
import mongoose from "mongoose";
dotenv.config({ path: ".env" });

communityResProducer.connect();

export let communityHandler = {};

// @route POST api/mycommunity/create
// @desc create new community
// @access Private
communityHandler.create = async (id, params, body, user, files) => {
  const { communityName, description, rules } = body;
  try {
    const checkUniqueName = await Community.findOne({ communityName });
    if (checkUniqueName) {
      // return res.status(400).json({
      //   errors: [{ msg: `${communityName} community already exists.` }],
      // });
      return communityResProducer.send({
        topic: "community_response",
        messages: [
          {
            value: JSON.stringify({
              id,
              status: 400,
              data: {
                errors: [
                  {
                    msg: `${communityName} community already exists.`,
                  },
                ],
              },
            }),
          },
        ],
      });
    }
    const newCommunity = new Community({
      communityName,
      creatorID: user.id,
    });

    if (description) {
      newCommunity.description = description;
    }

    if (files) {
      // const files = files;

      // const locationPromises = files.map(async (item) => {
      //   let myFile = item.originalname.split(".");
      //   let fileType = myFile[myFile.length - 1];
      //   let params = {
      //     Bucket: process.env.AWS_BUCKET_NAME,
      //     Key: `${uuid()}.${fileType}`,
      //     Body: item.buffer,
      //   };

      //   const resp = await S3.upload(params).promise();
      //   return resp.Key;
      // });
      // const imageLinks = await Promise.all(locationPromises);
      newCommunity.images = files;
    }

    await newCommunity.save();
    const communityID = newCommunity._id;

    if (rules) {
      const parsedRules = JSON.parse(rules);
      await Community.findByIdAndUpdate(
        communityID,
        { $set: { rules: parsedRules } },
        { new: true }
      );
    }
    await User.findByIdAndUpdate(user.id, {
      $addToSet: { communities: communityID },
    });
    communityResProducer.send({
      topic: "community_response",
      messages: [
        {
          value: JSON.stringify({
            id,
            status: 200,
            data: "Community createdd",
          }),
        },
      ],
    });
    // res.json("Community created");
  } catch (error) {
    console.log(error);
    communityResProducer.send({
      topic: "community_response",
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

// @route PUT api/mycommunity/:community_id
// @desc update community
// @access Private
communityHandler.updateCommunity = async (id, params, body, files) => {
  const { description, rules } = body;
  const communityFields = {};
  if (description) {
    communityFields.description = description;
  }
  if (rules) {
    const parsedRules = JSON.parse(rules);
    communityFields.rules = parsedRules;
  }

  let imageLinks;
  if (files) {
    const files = files;

    const locationPromises = files.map(async (item) => {
      let myFile = item.originalname.split(".");
      let fileType = myFile[myFile.length - 1];
      let params = {
        Bucket: "redditbucket10",
        Key: `${uuid()}.${fileType}`,
        Body: item.buffer,
      };

      const resp = await S3.upload(params).promise();
      return resp.Key;
    });
    imageLinks = await Promise.all(locationPromises);
  }

  try {
    await Community.findByIdAndUpdate(params.community_id, {
      $set: communityFields,
      $addToSet: { images: { $each: imageLinks } },
    });
    communityResProducer.send({
      topic: "community_response",
      messages: [
        {
          value: JSON.stringify({
            id,
            status: 200,
            data: "Community updated",
          }),
        },
      ],
    });
    // res.json("Community updated");
  } catch (error) {
    console.log(error);
    communityResProducer.send({
      topic: "community_response",
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

// @route GET api/mycommunity/
// @desc get list of communities
// @access Private
communityHandler.getAllMyCommunities = async (id, params, body, user) => {
  try {
    const myCommunities = await Community.find({ creatorID: user.id });

    const communityInfo = myCommunities.map((community) => {
      return {
        id: community.id,
        communityName: community.communityName,
        description: community.description,
        postsCount: community.posts.length,
        createdDate: community.createdDate,
        subscribersCount: community.subscribers.length,
        images: community.images,
        upvotes: community.upvotes.length,
        downvotes: community.downvotes.length,
        rules: community.rules,
        difference: Math.abs(
          community.upvotes.length - community.downvotes.length
        ),
      };
    });
    communityResProducer.send({
      topic: "community_response",
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
    communityResProducer.send({
      topic: "community_response",
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

// @route DELETE api/mycommunity/:community_id
// @desc delete a community
// @access Private
communityHandler.deleteCommunity = async (id, params) => {
  try {
    const deletedCommunity = await Community.findByIdAndDelete(
      params.community_id
    );

    await sqlDB.deletePosts(deletedCommunity.id);
    communityResProducer.send({
      topic: "community_response",
      messages: [
        {
          value: JSON.stringify({
            id,
            status: 200,
            data: "deleted",
          }),
        },
      ],
    });
    // res.json("deleted");
  } catch (error) {
    console.log(error);
    communityResProducer.send({
      topic: "community_response",
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

// @route POST api/mycommunity/vote
// @desc vote for a community
// @access Private
//
communityHandler.addVote = async (id, params, body, user) => {
  const { communityId, vote } = body;
  let obj = await Community.find({
    _id: communityId,
    downvotes: mongoose.Types.ObjectId(user.id),
  });
  let obj2 = await Community.find({
    _id: communityId,
    upvotes: mongoose.Types.ObjectId(user.id),
  });
  if (obj.length === 0 && obj2.length === 0) {
    try {
      if (vote === 1) {
        const community = await Community.findByIdAndUpdate(
          communityId,
          { $push: { upvotes: user.id } },
          { new: true, upsert: true }
        );
        // function (err, community) {
        // if (err) return console.log(err);
        communityResProducer.send({
          topic: "community_response",
          messages: [
            {
              value: JSON.stringify({
                id,
                status: 200,
                data: community,
              }),
            },
          ],
        });
        // res.json(community);
        // }
        // );
      } else {
        const community = await Community.findByIdAndUpdate(
          communityId,
          { $push: { downvotes: user.id } },
          { new: true, upsert: true }
        );
        // function (err, community) {
        // if (err) return console.log(err);
        communityResProducer.send({
          topic: "community_response",
          messages: [
            {
              value: JSON.stringify({
                id,
                status: 200,
                data: community,
              }),
            },
          ],
        });
        // res.json(community);
      }
      // );
      // }
    } catch (error) {
      console.log(error);
      communityResProducer.send({
        topic: "community_response",
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
  } else {
    communityResProducer.send({
      topic: "community_response",
      messages: [
        {
          value: JSON.stringify({
            id,
            status: 500,
            data: "user already vote",
          }),
        },
      ],
    });
    // res.status(500).send("user already voted");
  }
};

