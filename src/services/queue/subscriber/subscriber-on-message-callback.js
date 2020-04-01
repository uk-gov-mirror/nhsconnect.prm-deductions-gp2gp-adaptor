import {
  eventFinished,
  updateLogEvent,
  updateLogEventWithError
} from '../../../middleware/logging';
import { handleMessage } from './';

export const subscriberOnMessageCallback = (client, message) => async (err, body) => {
  updateLogEvent({ status: 'Handling Message', queue: { messageId: message.id, body } });

  if (err) {
    updateLogEventWithError(err);
    eventFinished();
    return;
  }

  try {
    await handleMessage(body);
    // client.ack(message);
  } catch (err) {
    updateLogEventWithError(err);
    // client.ack(message);
  } finally {
    // updateLogEvent({ status: 'Acknowledged Message' });
    eventFinished();
  }
  return;
};
