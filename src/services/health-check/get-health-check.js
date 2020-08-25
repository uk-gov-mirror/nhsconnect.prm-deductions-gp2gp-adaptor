import { updateLogEvent } from '../../middleware/logging';

export function getHealthCheck() {
  updateLogEvent({ status: 'Starting health check' });

  return new Promise(resolve =>
    resolve({
      version: '1',
      description: 'Health of GP2GP Adapter service',
      node_env: process.env.NODE_ENV
    })
  );
}
