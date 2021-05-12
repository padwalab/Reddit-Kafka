import { sqlDB } from "../config/queries.js";
// import _ from "lodash";
import { commentResProducer } from "../kafka/producers/commentResProducer.js";
import { commentReqConsumer } from "../kafka/consumers/commentReqConsumer.js";

commentResProducer.connect();

export let commentHandler = {};

// @route POST api/comment/
// @desc add new comment
// @access Private
commentHandler.addComment = async (id, params, body, user) => {
  const { postId, text, parentId } = body;
  try {
    const result = await sqlDB.insertComment(
      postId,
      text,
      user.id,
      parentId,
      user.firstName
    );
    if (result.affectedRows > 0) {
      const comment = await sqlDB.getRecentComment(result.insertId);
      commentResProducer.send({
        topic: "comment_response",
        messages: [
          {
            value: JSON.stringify({
              id,
              status: 200,
              data: comment,
            }),
          },
        ],
      });
      // res.send(comment);
    }
  } catch (error) {
    console.log(error);
    console.log(error);
    commentResProducer.send({
      topic: "comment_response",
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

// @route DELETE api/comment/
// @desc delete a comment and its sub-Comments
// @access Private
commentHandler.deleteComment = async (id, params, body) => {
  const { commentId } = body;
  try {
    const childIds = await sqlDB.getChildCommentIDs(commentId);
    const ids = childIds.map((ele) => ele.childId);
    const result = await sqlDB.deleteSubComments(ids);
    if (result.affectedRows > 0) {
      commentResProducer.send({
        topic: "comment_response",
        messages: [
          {
            value: JSON.stringify({
              id,
              status: 200,
              data: "Deleted comment",
            }),
          },
        ],
      });
      // res.status(200).send("");
    }
  } catch (error) {
    console.log(error);
    console.log(error);
    commentResProducer.send({
      topic: "comment_response",
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

// @route POST api/comment/vote
// @desc add vote for a comment
// @access Private
commentHandler.addVote = async (id, params, body, user) => {
  const { commentId, vote, userId } = body;
  let result = {};
  try {
    if (userId === user.id) {
      result = await sqlDB.addCommentVote(commentId, userId, vote, true);
    } else {
      result = await sqlDB.addCommentVote(commentId, userId, vote, false);
    }
    if (result.affectedRows > 0) {
      commentResProducer.send({
        topic: "comment_response",
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
    console.log(error);
    commentResProducer.send({
      topic: "comment_response",
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

// @route GET api/comment/vote
// @desc get all votes of a comment
// @access Private
commentHandler.voteCount = async (id, params, body, user) => {
  const { commentId } = body;
  try {
    const result = await sqlDB.getCommentVoteCount(commentId, user.id);
    commentResProducer.send({
      topic: "comment_response",
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
    console.log(error);
    commentResProducer.send({
      topic: "comment_response",
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
