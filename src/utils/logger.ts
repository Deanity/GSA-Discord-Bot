import pino from 'pino';
import chalk from 'chalk';
import { env } from '../config/env.js';

const pinoLogger = pino({
  level: env.LOG_LEVEL,
});

export const logger = {
  info(message: string, ...args: unknown[]): void {
    pinoLogger.info(message, ...(args as any[]));
    console.log(`${chalk.blue('[INFO]')} ${message}`, ...args);
  },
  
  ready(message: string, ...args: unknown[]): void {
    pinoLogger.info(message, ...(args as any[]));
    console.log(`${chalk.green('[READY]')} ${message}`, ...args);
  },
  
  command(message: string, ...args: unknown[]): void {
    pinoLogger.info(message, ...(args as any[]));
    console.log(`${chalk.magenta('[COMMAND]')} ${message}`, ...args);
  },
  
  warn(message: string, ...args: unknown[]): void {
    pinoLogger.warn(message, ...(args as any[]));
    console.log(`${chalk.yellow('[WARN]')} ${message}`, ...args);
  },
  
  error(message: string, error?: unknown, ...args: unknown[]): void {
    if (error instanceof Error) {
      pinoLogger.error({ err: error }, message, ...(args as any[]));
      console.error(`${chalk.red('[ERROR]')} ${message}`, error.stack || error.message, ...args);
    } else {
      pinoLogger.error({ error }, message, ...(args as any[]));
      console.error(`${chalk.red('[ERROR]')} ${message}`, error !== undefined ? error : '', ...args);
    }
  },
  
  debug(message: string, ...args: unknown[]): void {
    pinoLogger.debug(message, ...(args as any[]));
    if (env.LOG_LEVEL === 'debug' || env.LOG_LEVEL === 'trace') {
      console.log(`${chalk.gray('[DEBUG]')} ${message}`, ...args);
    }
  }
};

