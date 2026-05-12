/**
 * Lightweight structured logger.
 *
 * In production, `next.config.ts` already strips `console.*` via
 * `compiler.removeConsole`. This logger adds structure in development
 * and is a single replacement target if we later pipe to a service.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogPayload {
  [key: string]: unknown;
}

function format(level: LogLevel, message: string, data?: LogPayload): string {
  const ts = new Date().toISOString();
  const base = `[${ts}] [${level.toUpperCase()}] ${message}`;
  return data ? `${base} ${JSON.stringify(data)}` : base;
}

export const logger = {
  debug(message: string, data?: LogPayload) {
    if (process.env.NODE_ENV === 'development') {
      console.debug(format('debug', message, data));
    }
  },

  info(message: string, data?: LogPayload) {
    console.log(format('info', message, data));
  },

  warn(message: string, data?: LogPayload) {
    console.warn(format('warn', message, data));
  },

  error(message: string, data?: LogPayload) {
    console.error(format('error', message, data));
  },
};
