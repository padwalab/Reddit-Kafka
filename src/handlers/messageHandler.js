import Message from "../models/Message.js";
import { redisClient } from "../config/redisClient.js";
import { messageResProducer } from "../kafka/producers/messageResProducer.js";
import { messageReqConsumer } from "../kafka/consumers/messageReqConsumer.js";

messageResProducer.connect();

export let messageHandler = {};

// @route POST api/messages/sendMessage
// @desc send a message to other user
// @access Private
messageHandler.sendMessage = async (id, params, body, user) => {
  try {
    const { toUserId, text } = body;
    let message = new Message({ toUserId, fromUserId: user.id, text });
    await message
      .save()
      .then((doc) =>
        doc
          .populate("toUserId", "firstName")
          .populate("fromUserId", "firstName")
          .execPopulate()
      );

    redisClient.get(user.id, async (err, data) => {
      // If value for key is available in Redis
      if (data) {
        data = JSON.parse(data);
        const updatedData = [...data, message];
        redisClient.setex(user.id, 3000, JSON.stringify(updatedData));
      }
      // If value for given key is not available in Redis
      else {
        await Message.find({
          $or: [{ toUserId: user.id }, { fromUserId: user.id }],
        })
          .populate("toUserId", "firstName")
          .populate("fromUserId", "firstName")
          .then((messages) => {
            const msg = JSON.stringify(messages);
            redisClient.setex(user.id, 36000, msg);
          });
      }
    });

    redisClient.get(toUserId, async (err, data) => {
      // If value for key is available in Redis
      if (data) {
        data = JSON.parse(data);
        const updatedData = [...data, message];
        redisClient.setex(toUserId, 3000, JSON.stringify(updatedData));
      }
      // If value for given key is not available in Redis
      else {
        await Message.find({
          $or: [{ toUserId }, { fromUserId: toUserId }],
        })
          .populate("toUserId", "firstName")
          .populate("fromUserId", "firstName")
          .then((messages) => {
            const msg = JSON.stringify(messages);
            redisClient.setex(toUserId, 36000, msg);
          });
        await Message.find()
          .or([{ toUserId: user.id }, { fromUserId: user.id }])
          .populate("toUserId", "firstName")
          .populate("fromUserId", "firstName")
          .then((messages) => {
            redisClient.setex(user.id, 3000, JSON.stringify(messages));
          });
      }
    });

    messageResProducer.send({
      topic: "messages_response",
      messages: [
        {
          value: JSON.stringify({
            id,
            status: 200,
            data: message,
          }),
        },
      ],
    });
    // res.send(message);
  } catch (error) {
    console.log(error);
    messageResProducer.send({
      topic: "messages_response",
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

// @route GET api/messages/
// @desc get all conversation specific to a user
// @access Private
messageHandler.getMessages = async (id, params, user) => {
  try {
    redisClient.get(user.id, async (err, data) => {
      // If value for key is available in Redis
      if (data) {
        console.log(
          JSON.stringify({
            id,
            status: 200,
            data: data,
          })
        );
        messageResProducer.send({
          topic: "messages_response",
          messages: [
            {
              value: JSON.stringify({
                id,
                status: 200,
                data: data,
              }),
            },
          ],
        });
        // res.send(data);
      }
      // If value for given key is not available in Redis
      else {
        await Message.find({
          $or: [{ toUserId: user.id }, { fromUserId: user.id }],
        })
          .populate("toUserId", "firstName")
          .populate("fromUserId", "firstName")
          .then((messages) => {
            const msg = JSON.stringify(messages);
            redisClient.setex(user.id, 36000, msg);
            console.log(
              JSON.stringify({
                id,
                status: 200,
                data: msg,
              })
            );
            messageResProducer.send({
              topic: "messages_response",
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
            // res.send(msg);
          });
      }
    });
  } catch (error) {
    console.log(error);
    console.log(
      JSON.stringify({
        id,
        status: 500,
        data: "Server error",
      })
    );
    messageResProducer.send({
      topic: "messages_response",
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
