import { kafka } from "../kafka.js";
import { communityHandler } from "../../handlers/communityHandler.js";

export const communityReqConsumer = kafka.consumer({
  groupId: "community-kafka-backend",
});

communityReqConsumer.connect();
communityReqConsumer.subscribe({ topic: "community_request" });

communityReqConsumer.run({
  eachMessage: ({ topic, partition, message }) => {
    const data = JSON.parse(message.value.toString());
    console.log({ ...data, topic });
    switch (data.action) {
      case "create":
        communityHandler.create(
          data.id,
          data.params,
          data.body,
          data.user,
          data.files
        );
        break;
      case "updateCommunity":
        communityHandler.updateCommunity(
          data.id,
          data.params,
          data.body,
          data.files
        );
        break;
      case "getAllMyCommunities":
        communityHandler.getAllMyCommunities(
          data.id,
          data.params,
          data.body,
          data.user
        );
        break;
      case "deleteCommunity":
        communityHandler.deleteCommunity(data.id, data.params);
        break;
      case "addVote":
        communityHandler.addVote(data.id, data.params, data.body, data.user);
        break;
    }
  },
});
