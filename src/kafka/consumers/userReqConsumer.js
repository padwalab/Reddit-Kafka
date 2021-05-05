import { kafka } from "../kafka.js";
import { userHandler } from "../../handlers/userHandler.js";

export const userReqConsumer = kafka.consumer({
  groupId: "users-kafka-backend",
});

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
      case "loadUser":
        userHandler.loadUser(data.id, data.params, data.body, data.user);
        break;
      case "login":
        userHandler.login(data.id, data.params, data.body);
        break;
      case "updateProfile":
        userHandler.updateProfile(
          data.id,
          data.params,
          data.body,
          data.user,
          data.file
        );
        break;
      case "getProfileByUserId":
        userHandler.getProfileByUserId(data.id, data.params, data.body);
        break;
    }
  },
});
