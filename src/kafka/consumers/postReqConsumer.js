import { kafka } from "../kafka.js";
import { postHandler } from "../../handlers/postHandler.js";

export const postReqConsumer = kafka.consumer({
  groupId: "post-kafka-backend",
});

postReqConsumer.connect();
postReqConsumer.subscribe({ topic: "post_request" });

postReqConsumer.run({
  eachMessage: ({ topic, partition, message }) => {
    const data = JSON.parse(message.value.toString());
    console.log({ ...data, topic });
    switch (data.action) {
      case "addPost":
        postHandler.addPost(data.id, data.params, data.body, data.user);
        break;
      case "deletePost":
        postHandler.deletePost(data.id, data.params, data.body, data.user);
        break;
      case "addVote":
        postHandler.addVote(data.id, data.params, data.body, data.user);
        break;
      case "voteCount":
        postHandler.voteCount(data.id, data.params, data.body, data.user);
        break;
      case "getPostById":
        postHandler.getPostById(data.id, data.params, data.body);
        break;
    }
  },
});
