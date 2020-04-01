import { updateLogEventWithError } from '../../../middleware/logging';

export const putMessageOnQueue = (client, message, options) => {
  const transaction = client.begin();

  try {
    const stream = transaction.send(options);
    stream.write('HELLO');
    stream.end();
    transaction.commit();
  } catch (err) {
    updateLogEventWithError(err);
    transaction.abort();
  }
};
