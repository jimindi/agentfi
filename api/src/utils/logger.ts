import pino from 'pino';
import { env } from '../config/env';

export const logger = pino({
  level: env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      ignore: 'pid,hostname',
      translateTime: 'SYS:standard'
    }
  },
  redact: {
    paths: [
      'req.headers.authorization',
      'apiKey',
      'privateKey',
      'password'
    ],
    remove: true
  }
});
