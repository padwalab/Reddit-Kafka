import { kafka } from '../kafka.js';
import { communityHomeHandler } from '../../handlers/communityHomeHandler.js';

export const communityHomeReqConsumer = kafka.consumer({
  groupId: 'commhome-kafka-backend',
});

communityHomeReqConsumer.connect();
communityHomeReqConsumer.subscribe({ topic: 'commhome_request' });

communityHomeReqConsumer.run({
  eachMessage: ({ topic, partition, message }) => {
    const data = JSON.parse(message.value.toString());
    console.log({ ...data, topic });
    switch (data.action) {
      case 'requestToJOin':
        communityHomeHandler.requestToJOin(
          data.id,
          data.params,
          data.body,
          data.user
        );
        break;
      case 'getCommunityInfo':
        communityHomeHandler.getCommunityInfo(
          data.id,
          data.params,
          data.body,
          data.user
        );
        break;
      case 'leaveCommunity':
        communityHomeHandler.leaveCommunity(
          data.id,
          data.params,
          data.body,
          data.user
        );
        break;
    }
  },
});
