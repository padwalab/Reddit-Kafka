import { kafka } from "../kafka.js";
import { inviteHandler } from "../../handlers/inviteHandler.js";

export const inviteReqConsumer = kafka.consumer({
  groupId: "invite-kafka-backend",
});

inviteReqConsumer.connect();
inviteReqConsumer.subscribe({ topic: "invite_request" });

inviteReqConsumer.run({
  eachMessage: ({ topic, partition, message }) => {
    const data = JSON.parse(message.value.toString());
    console.log({ ...data, topic });
    switch (data.action) {
      case "inviteUser":
        inviteHandler.inviteUser(data.id, data.params, data.body, data.user);
        break;
      case "loadCommunityInvites":
        inviteHandler.loadCommunityInvites(
          data.id,
          data.params,
          data.body,
          data.user
        );
        break;
      case "loadUserInvites":
        inviteHandler.loadUserInvites(
          data.id,
          data.params,
          data.body,
          data.user
        );
        break;
      case "inviteAction":
        inviteHandler.inviteAction(data.id, data.params, data.body, data.user);
        break;
    }
  },
});
