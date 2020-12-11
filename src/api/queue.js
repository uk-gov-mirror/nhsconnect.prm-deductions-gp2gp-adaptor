import express from 'express';
import axios from 'axios';
import { initialiseConfig } from '../config';
import { logError, logEvent } from '../middleware/logging';

const router = express.Router();

router.get('/', async (req, res, next) => {
  const config = initialiseConfig();
  const url = `https://test.gp-to-repo.patient-deductions.nhs.uk/deduction-requests/775C7654-DE26-4516-9710-F50F303A0961/pds-update`;
  try {
    await axios.patch(url, {}, { headers: { Authorization: `${config.gpToRepoAuthKeys}` } });
  } catch (e) {
    logError(e);
  }
  logEvent('hello from queue endpoint');
  res.sendStatus(200);
});

export default router;
