import { kafka } from "../kafka.js";
import { communityAnalyticsHandler } from "../../handlers/communityAnalyticsHandler.js";

export const communityAnalyticsReqConsumer = kafka.consumer({
  groupId: "analytics-kafka-backend",
});

communityAnalyticsReqConsumer.connect();
communityAnalyticsReqConsumer.subscribe({ topic: "analytics_request" });

communityAnalyticsReqConsumer.run({
  eachMessage: ({ topic, partition, message }) => {
    const data = JSON.parse(message.value.toString());
    console.log({ ...data, topic });
    switch (data.action) {
      case "analytics":
        communityAnalyticsHandler.analytics(data.id, data.params, data.user);
        break;
    }
  },
});
