import app from './app';
import { logError, logInfo } from './middleware/logging';
import axios from 'axios';
import { tracer } from './tracing';
import { context, setSpan } from '@opentelemetry/api';

app.listen(3001, () => logInfo('Listening on port 3001'));

const comm = () => {
  const span = tracer.startSpan('axios_span', context.active());
  context.with(setSpan(context.active(), span), async () => {
    try {
      await axios.get(`http://127.0.0.1:3000/health`).then(r => console.log(r));
      logInfo('here');
    } catch (e) {
      logError('error');
    }
  });
  span.end();
};

comm();
