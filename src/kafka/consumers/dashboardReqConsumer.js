import { kafka } from "../kafka.js";
import { dashboardHandler } from "../../handlers/dashboardHandler.js";

export const dashboardReqConsumer = kafka.consumer({
  groupId: "dashboard-kafka-backend",
});

dashboardReqConsumer.connect();
dashboardReqConsumer.subscribe({ topic: "dashboard_request" });

dashboardReqConsumer.run({
  eachMessage: ({ topic, partition, message }) => {
    const data = JSON.parse(message.value.toString());
    console.log({ ...data, topic });
    switch (data.action) {
      case "getAllPosts":
        dashboardHandler.getAllPosts(
          data.id,
          data.params,
          data.body,
          data.user
        );
        break;
    }
  },
});
