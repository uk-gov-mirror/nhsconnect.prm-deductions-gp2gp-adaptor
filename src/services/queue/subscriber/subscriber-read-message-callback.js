import { subscriberOnMessageCallback } from './subscriber-on-message-callback';
import {
  eventFinished,
  updateLogEvent,
  updateLogEventWithError,
  withContext
} from '../../../middleware/logging';
import { handleMessage } from "./message-handler";

export const subscriberReadMessageCallback = client => (err, messageStream) => {
  withContext(() => {
    updateLogEvent({ status: 'Subscriber has Received Message' });

    if (err) {
      updateLogEventWithError(err);
      eventFinished();
      return;
    }
    messageStream.readString('UTF-8', async (err, body) => {
      updateLogEvent({ status: 'Handling Message', queue: { messageId: messageStream.id, body } });

      if (err) {
        updateLogEventWithError(err);
        eventFinished();
        return;
      }

      try {
        await handleMessage(body);
        client.ack();
      } catch (err) {
        updateLogEventWithError(err);
        client.ack();
      } finally {
        // updateLogEvent({ status: 'Acknowledged Message' });
        eventFinished();
      }
    });
  });
};
