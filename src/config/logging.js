import { createLogger, format, transports } from 'winston';
import { getSpan, context } from '@opentelemetry/api';
import traverse from 'traverse';
import cloneDeep from 'lodash.clonedeep';
import { initializeConfig } from './index';

export const obfuscateSecrets = format(info => {
  const OBFUSCATED_VALUE = '********';
  const SECRET_KEYS = ['passcode', 'data', 'authorization'];
  const updated = cloneDeep(info);
  traverse(updated).forEach(function () {
    if (SECRET_KEYS.includes(this.key)) this.update(OBFUSCATED_VALUE);
  });
  return updated;
});

export const addCommonFields = format(info => {
  const { nhsEnvironment } = initializeConfig();
  const updated = cloneDeep(info);
  const currentSpan = getSpan(context.active());
  updated.level = updated.level.toUpperCase();
  updated['traceId'] = currentSpan && currentSpan.context().traceId;
  updated['service'] = 'gp2gp-adaptor';
  updated['environment'] = nhsEnvironment;
  return updated;
});

export const options = {
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    obfuscateSecrets(),
    addCommonFields(),
    format.json()
  ),
  transports: [new transports.Console({ handleExceptions: true })]
};

export const logger = createLogger(options);
