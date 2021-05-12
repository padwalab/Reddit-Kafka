import { kafka } from "../kafka.js";
import { commentHandler } from "../../handlers/commentHandler.js";

export const commentReqConsumer = kafka.consumer({
  groupId: "comments-kafka-backend",
});

commentReqConsumer.connect();
commentReqConsumer.subscribe({ topic: "comment_request" });

commentReqConsumer.run({
  eachMessage: ({ topic, partition, message }) => {
    const data = JSON.parse(message.value.toString());
    console.log({ ...data, topic });
    switch (data.action) {
      case "addComment":
        commentHandler.addComment(data.id, data.params, data.body, data.user);
        break;
      case "deleteComment":
        commentHandler.deleteComment(data.id, data.params, data.body);
        break;
      case "addVote":
        commentHandler.addVote(data.id, data.params, data.body, data.user);
        break;
      case "voteCount":
        commentHandler.voteCount(data.id, data.params, data.body, data.user);
        break;
    }
  },
});
