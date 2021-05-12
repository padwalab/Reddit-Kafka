import { kafka } from "../kafka.js";
import { moderationHandler } from "../../handlers/moderationHandler.js";

export const moderationReqConsumer = kafka.consumer({
  groupId: "moderation-kafka-backend",
});

moderationReqConsumer.connect();
moderationReqConsumer.subscribe({ topic: "moderation_request" });

moderationReqConsumer.run({
  eachMessage: ({ topic, partition, message }) => {
    const data = JSON.parse(message.value.toString());
    console.log({ ...data, topic });
    switch (data.action) {
      case "getListOfCommunities":
        moderationHandler.getListOfCommunities(
          data.id,
          data.params,
          data.body,
          data.user
        );
        break;
      case "acceptJoinReqs":
        moderationHandler.acceptJoinReqs(
          data.id,
          data.params,
          data.body,
          data.user
        );
        break;
      case "deleteUserFromCommunities":
        moderationHandler.deleteUserFromCommunities(
          data.id,
          data.params,
          data.body,
          data.user
        );
        break;
    }
  },
});
