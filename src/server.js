import app from './app';
import { initialiseSubscriber } from './services/queue/subscriber';
import { logEvent } from './middleware/logging';

initialiseSubscriber();

// app.listen(3000, () => logEvent('Listening on port 3000'));
console.log('Worker is started. Press any key to exit');

process.stdin.setRawMode(true);
process.stdin.resume();
process.stdin.on('data', process.exit.bind(process, 0));
