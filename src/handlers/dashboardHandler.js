import Community from "../models/Community.js";
import { getPosts } from "./communityHomeHandler.js";

import { dashboardResProducer } from "../kafka/producers/dashboardResProducer.js";
import { dashboardReqConsumer } from "../kafka/consumers/dashboardReqConsumer.js";

// userConsumer.start();
dashboardResProducer.connect();

export let dashboardHandler = {};

// @route GET api/dashboard/
// @desc get all posts along with comments
// @access Private
dashboardHandler.getAllPosts = async (id, params, body, user) => {
  try {
    const myCommunities = await Community.find(
      { creatorID: user.id },
      { id: 1, communityName: 1 }
    );
    const rootPromises = myCommunities.map(async (ele) => {
      return getPosts(ele.id, ele.communityName, user.id);
    });
    const nestedComments = await Promise.all(rootPromises);

    dashboardResProducer.send({
      topic: "dashboard_response",
      messages: [
        {
          value: JSON.stringify({
            id,
            status: 200,
            data: nestedComments,
          }),
        },
      ],
    });
    // res.json(nestedComments);
  } catch (error) {
    console.log(error);
    dashboardResProducer.send({
      topic: "dashboard_response",
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
