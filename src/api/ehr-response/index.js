import express from 'express';
import { authenticateRequest } from '../../middleware/auth';
import { validate } from '../../middleware/validation';
import { handleMessage } from '../../services/queue/subscriber/message-handler';

const ehrResponseRouter = express.Router();

ehrResponseRouter.post('/', authenticateRequest, validate, async (req, res) => {
  await handleMessage(req.body.message);
  res.sendStatus(200);
});

export default ehrResponseRouter;
