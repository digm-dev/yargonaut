import { format } from 'node:util';
import ansis from 'ansis';

// format() - Format all arguments into a single string

const logger = {
  // biome-ignore lint/suspicious/noExplicitAny: This is a logger
  debug: (...messages: any[]): void => {
    if (process.env.DEBUG !== undefined) {
      const formattedMessage = format(...messages);
      console.log(ansis.magentaBright(`[DEBUG] ${formattedMessage}`));
    }
  },

  // biome-ignore lint/suspicious/noExplicitAny: This is a logger
  info: (...messages: any[]): void => {
    const formattedMessage = format(...messages);
    // 2. Apply style to the formatted string (including prefix)
    console.log(ansis.blueBright(`[INFO] ${formattedMessage}`));
  },

  // biome-ignore lint/suspicious/noExplicitAny: This is a logger
  error: (...messages: any[]): void => {
    const formattedMessage = format(...messages);
    // Use console.error for stderr
    console.error(ansis.redBright(`[ERROR] ${formattedMessage}`));
  },

  // biome-ignore lint/suspicious/noExplicitAny: This is a logger
  warn: (...messages: any[]): void => {
    const formattedMessage = format(...messages);
    // Use console.warn (usually stderr)
    console.warn(ansis.yellowBright(`[WARN] ${formattedMessage}`));
  },

  // biome-ignore lint/suspicious/noExplicitAny: This is a logger
  default: (...messages: any[]): void => {
    const formattedMessage = format(...messages);
    console.log(formattedMessage);
  },

  /**
   * Logs messages specifically related to process steps
   */
  // biome-ignore lint/suspicious/noExplicitAny: This is a logger
  step: (...messages: any[]): void => {
    const formattedMessage = format(...messages);
    console.log(ansis.cyanBright(`[STEP] ${formattedMessage}`));
  },

  /**
   * Example: A logger that makes the entire output bold.
   */
  // biome-ignore lint/suspicious/noExplicitAny: This is a logger
  bold: (...messages: any[]): void => {
    const formattedMessage = format(...messages);
    console.log(ansis.bold(formattedMessage));
  },
};

export default logger;
