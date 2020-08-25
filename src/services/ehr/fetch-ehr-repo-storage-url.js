import axios from 'axios';
import config from '../../config';
import { eventFinished, updateLogEvent } from '../../middleware/logging';

export const fetchStorageUrl = async body => {
  try {
    return await axios.post(`${config.ehrRepoUrl}/fragments`, body, {
      headers: { Authorization: process.env.AUTHORIZATION_KEYS }
    });
  } catch (err) {
    updateLogEvent({ status: 'failed to get pre-signed url', error: err.stack });
    throw err;
  } finally {
    eventFinished();
  }
};
