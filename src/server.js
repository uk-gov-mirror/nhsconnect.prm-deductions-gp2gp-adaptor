import app from './app';
import { logDebug, logInfo } from './middleware/logging';
import axios from 'axios';
import { tracer } from './tracing';
import { context, setSpan } from '@opentelemetry/api';
// import { initializeConfig } from './config';

app.listen(3001, () => logInfo('Listening on port 3001'));

const span = tracer.startSpan('axios_span', context.active());
 try {
  context
    .with(setSpan(context.active(), span), async () => {
      await axios.get(`http://127.0.0.1:3000/health`);
    })
    .then(r => console.log(r));
  console.log(span.spanContext, 'here');
  // span.end();
} catch (e) {
  // console.log(e);
}
