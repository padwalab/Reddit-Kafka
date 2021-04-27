import { kafka } from "../kafka.js";
import { userHandler } from "../../handlers/userHandler.js";

export const userReqConsumer = kafka.consumer({ groupId: "user-group" });

userReqConsumer.connect();
userReqConsumer.subscribe({ topic: "users_request" });

userReqConsumer.run({
  eachMessage: ({ topic, partition, message }) => {
    const data = JSON.parse(message.value.toString());
    console.log({ ...data, topic });
    switch (data.action) {
      case "register":
        userHandler.register(data.id, data.params, data.body);
        break;
    }
  },
});
