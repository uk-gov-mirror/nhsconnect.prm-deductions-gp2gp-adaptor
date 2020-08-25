import express from 'express';
import { updateLogEvent, updateLogEventWithError } from '../middleware/logging';
import { getHealthCheck } from '../services/health-check/get-health-check';

const router = express.Router();

router.get('/', (req, res, next) => {
  getHealthCheck()
    .then(status => {
      updateLogEvent({ status: 'Health check completed' });

      res.status(200).send(status);
    })
    .catch(err => {
      updateLogEventWithError(err);
      next(err);
    });
});

export default router;
