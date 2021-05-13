import { sqlDB } from "../config/queries.js";
import Community from "../models/Community.js";
import dotenv from "dotenv";
dotenv.config({ path: ".env" });
import { S3 } from "../config/s3.js";
import uuid from "uuid";

import { postResProducer } from "../kafka/producers/postResProducer.js";
import { postReqConsumer } from "../kafka/consumers/postReqConsumer.js";

// userConsumer.start();
postResProducer.connect();

export let postHandler = {};

// @route POST api/post
// @desc add post in a community
// @access Private
postHandler.addPost = async (id, params, body, user) => {
  let { communityId, content, title, type } = body;
  try {
    // if (files.length > 0) {
    //   content = files;
    //   const locationPromises = content.map(async (item) => {
    //     let myFile = item.originalname.split(".");
    //     let fileType = myFile[myFile.length - 1];
    //     let params = {
    //       Bucket: process.env.AWS_BUCKET_NAME,
    //       Key: `${uuid()}.${fileType}`,
    //       Body: item.buffer,
    //     };
    //     const resp = await S3.upload(params).promise();
    //     return resp.Key;
    //   });
    //   const contentPromises = await Promise.all(locationPromises);
    //   content = contentPromises.join();
    // }
    const result = await sqlDB.addPost(
      user.id,
      communityId,
      content,
      type,
      title,
      user.firstName
    );
    if (result.affectedRows > 0) {
      await Community.findByIdAndUpdate(
        communityId,
        { $push: { posts: result.insertId } },
        { safe: true, upsert: true }
      );
      const post = await sqlDB.getRecentPost(result.insertId);
      postResProducer.send({
        topic: "post_response",
        messages: [
          {
            value: JSON.stringify({
              id,
              status: 200,
              data: post,
            }),
          },
        ],
      });
      // res.send(post);
    }
  } catch (error) {
    console.log(error);
    postResProducer.send({
      topic: "post_response",
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

// @route DELETE api/post
// @desc delete post in a community
// @access Private
postHandler.deletePost = async (id, params, body, user) => {
  const { postId, communityId } = body;
  try {
    const result = await sqlDB.deletePost(postId);
    if (result.affectedRows > 0) {
      const community = await Community.findByIdAndUpdate(
        communityId,
        { $pull: { posts: postId } },
        { safe: true, upsert: true }
      );
      postResProducer.send({
        topic: "post_response",
        messages: [
          {
            value: JSON.stringify({
              id,
              status: 200,
              data: "Post Deleted",
            }),
          },
        ],
      });
      // res.status(200).send("Post Deleted");
    }
  } catch (error) {
    console.log(error);
    postResProducer.send({
      topic: "post_response",
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

// @route POST api/post/vote
// @desc add vote for a comment
// @access Private
postHandler.addVote = async (id, params, body, user) => {
  const { postId, vote } = body;
  try {
    const result = await sqlDB.addPostVote(postId, user.id, vote);
    if (result.affectedRows > 0) {
      postResProducer.send({
        topic: "post_response",
        messages: [
          {
            value: JSON.stringify({
              id,
              status: 200,
              data: "Voted",
            }),
          },
        ],
      });
      // res.status(200).send("Voted");
    }
  } catch (error) {
    console.log(error);
    postResProducer.send({
      topic: "post_response",
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

// @route GET api/post/vote
// @desc get all votes of a post
// @access Private
postHandler.voteCount = async (id, params, body, user) => {
  const { postId } = body;
  try {
    const result = await sqlDB.getPostVoteCount(postId, user.id);
    postResProducer.send({
      topic: "post_response",
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
    // res.status(200).send(result);
  } catch (error) {
    postResProducer.send({
      topic: "post_response",
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
    // res.status(200).send("Server error");
  }
};
