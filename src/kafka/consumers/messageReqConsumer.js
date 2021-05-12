import { kafka } from "../kafka.js";
import { messageHandler } from "../../handlers/messageHandler.js";

export const messageReqConsumer = kafka.consumer({
  groupId: "messages-kafka-backend",
});

messageReqConsumer.connect();
messageReqConsumer.subscribe({ topic: "messages_request" });

messageReqConsumer.run({
  eachMessage: ({ topic, partition, message }) => {
    const data = JSON.parse(message.value.toString());
    console.log({ ...data, topic });
    switch (data.action) {
      case "sendMessage":
        messageHandler.sendMessage(data.id, data.params, data.body, data.user);
        break;
      case "getMessages":
        messageHandler.getMessages(data.id, data.params, data.user);
        break;
    }
  },
});
