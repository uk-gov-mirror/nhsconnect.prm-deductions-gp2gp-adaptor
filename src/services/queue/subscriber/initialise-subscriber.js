import config from '../../../config';
import { updateLogEvent, updateLogEventWithError } from '../../../middleware/logging';
import { connectToQueue } from '../helper';
import { subscriberReadMessageCallback } from './subscriber-read-message-callback';

const initialiseSubscriber = (options = {}) => {
  return connectToQueue((err, client) => {
    if (err) {
      updateLogEventWithError(err);
    }

    updateLogEvent({
      status: 'Initialising Subscriber',
      queue: { name: config.queueName, ...options, ackType: options.ack || 'client-individual' }
    });

    client.subscribe(
      { destination: config.queueName, ack: 'auto', ...options },
      subscriberReadMessageCallback(client)
    );
  });
};

export { initialiseSubscriber };
