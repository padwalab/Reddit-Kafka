import { kafka } from "../kafka.js";
import { communitySearchHandler } from "../../handlers/communitySearchHandler.js";

export const communitySeachReqConsumer = kafka.consumer({
  groupId: "commsearch-kafka-backend",
});

communitySeachReqConsumer.connect();
communitySeachReqConsumer.subscribe({ topic: "commsearch_request" });

communitySeachReqConsumer.run({
  eachMessage: ({ topic, partition, message }) => {
    const data = JSON.parse(message.value.toString());
    console.log({ ...data, topic });
    switch (data.action) {
      case "searchCommunity":
        communitySearchHandler.searchCommunity(data.id, data.params, data.user);
        break;
    }
  },
});
