import { format } from 'node:util';
import ansis from 'ansis';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';

const LOG_LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  silent: 4,
};

function createLogger() {
  let currentLevel: LogLevel = 'info'; // Default level

  const shouldLog = (level: LogLevel): boolean => {
    if (currentLevel === 'silent') {
      return false;
    }
    // The original check for `debug` is special, let's keep it.
    if (level === 'debug' && process.env.DEBUG === undefined) {
      return false;
    }
    return LOG_LEVEL_ORDER[level] >= LOG_LEVEL_ORDER[currentLevel];
  };

  return {
    /**
     * Sets the current logging level.
     * @param level The minimum level of logs to display.
     */
    setLevel(level: LogLevel) {
      currentLevel = level;
    },

    // biome-ignore lint/suspicious/noExplicitAny: This is a logger
    debug: (...messages: any[]): void => {
      if (shouldLog('debug')) {
        const formattedMessage = format(...messages);
        console.log(ansis.magentaBright(`[DEBUG] ${formattedMessage}`));
      }
    },

    // biome-ignore lint/suspicious/noExplicitAny: This is a logger
    info: (...messages: any[]): void => {
      if (shouldLog('info')) {
        const formattedMessage = format(...messages);
        console.log(ansis.blueBright(`[INFO] ${formattedMessage}`));
      }
    },

    // biome-ignore lint/suspicious/noExplicitAny: This is a logger
    error: (...messages: any[]): void => {
      if (shouldLog('error')) {
        const formattedMessage = format(...messages);
        console.error(ansis.redBright(`[ERROR] ${formattedMessage}`));
      }
    },

    // biome-ignore lint/suspicious/noExplicitAny: This is a logger
    warn: (...messages: any[]): void => {
      if (shouldLog('warn')) {
        const formattedMessage = format(...messages);
        console.warn(ansis.yellowBright(`[WARN] ${formattedMessage}`));
      }
    },

    // biome-ignore lint/suspicious/noExplicitAny: This is a logger
    default: (...messages: any[]): void => {
      if (shouldLog('info')) {
        // 'default' logs at 'info' level
        const formattedMessage = format(...messages);
        console.log(formattedMessage);
      }
    },

    /**
     * Logs messages specifically related to process steps
     */
    // biome-ignore lint/suspicious/noExplicitAny: This is a logger
    step: (...messages: any[]): void => {
      if (shouldLog('info')) {
        // 'step' logs at 'info' level
        const formattedMessage = format(...messages);
        console.log(ansis.cyanBright(`[STEP] ${formattedMessage}`));
      }
    },

    /**
     * Example: A logger that makes the entire output bold.
     */
    // biome-ignore lint/suspicious/noExplicitAny: This is a logger
    bold: (...messages: any[]): void => {
      if (shouldLog('info')) {
        // 'bold' logs at 'info' level
        const formattedMessage = format(...messages);
        console.log(ansis.bold(formattedMessage));
      }
    },
  };
}

export const logger = createLogger();
