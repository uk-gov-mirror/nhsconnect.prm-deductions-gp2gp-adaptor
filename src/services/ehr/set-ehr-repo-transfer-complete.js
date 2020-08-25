import axios from 'axios';
import config from '../../config';
import { updateLogEvent } from '../../middleware/logging';

export const setTransferComplete = async body => {
  try {
    const response = await axios.patch(
      `${config.ehrRepoUrl}/fragments`,
      {
        body,
        transferComplete: true
      },
      { headers: { Authorization: process.env.AUTHORIZATION_KEYS } }
    );
    updateLogEvent({ ehrRepository: { transferSuccessful: true } });
    return response;
  } catch (err) {
    updateLogEvent({ status: 'failed to update transfer complete to ehr repo api', error: err });
    throw err;
  }
};
