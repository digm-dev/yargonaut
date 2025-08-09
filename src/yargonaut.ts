import { Result } from 'neverthrow';
import { type LogLevel, logger } from './logger';

import chalk from 'chalk';
import figlet, { type Fonts, type Options } from 'figlet';
import {
  type YargsKeyConfig,
  defaultYargsKeysConfig,
  defaultYargsStrings,
  // type TransformFunction, // Defined below
  getAllKnownKeys,
  getErrorKeys,
  getHelpKeys,
  transformUpToFirstColon,
  transformWholeString,
} from './yargs-keys';

/**
 * Defines a function that transforms text for figlet rendering.
 *
 * @param text - The text to transform
 * @returns An object containing the part to render with figlet and the part to leave unmodified
 */
export type TransformFunction = (_text: string) => { renderPart: string; nonRenderPart: string };

/**
 * Interface for the yargs instance that Yargonaut interacts with.
 */
interface YargsInstance {
  locale?: () => string;
  getLocale?: () => Record<string, string | { one: string; other: string }>;
  updateLocale: (
    _newStrings: Record<string, string | { one: string; other: string }>,
  ) => YargsInstance;
  locales?: Record<string, Record<string, string | { one: string; other: string }>>;
}

/**
 * Parameters for the output customization function.
 */
export interface OutputCustomizationParams {
  /** The yargs locale key being processed */
  key: string;
  /** The original string from yargs before any modifications */
  originalString: string | { one: string; other: string };
  /** The string after Yargonaut has applied fonts and styles */
  modifiedString: string | { one: string; other: string };
  /** The figlet library instance for additional font rendering if needed */
  figletInstance: typeof figlet;
  /** The name of the font that was applied, if any */
  fontName?: string;
  /** The style string that was applied, if any */
  styleString?: string;
}

/**
 * Function type for customizing output before it's sent to yargs.
 *
 * @param params - Object containing all parameters needed for customization
 * @returns The final string to use in the yargs locale
 */
export type OutputCustomizationFunction = (
  params: OutputCustomizationParams,
) => string | { one: string; other: string };

/**
 * Configuration applied to a yargs locale key.
 */
interface AppliedConfig {
  font?: string;
  style?: string;
  transform?: TransformFunction;
}

// --- Error Mapping Utilities ---
/**
 * Error type for generic error handling.
 */
interface SimpleError {
  message: string;
}

/**
 * Maps any error to a SimpleError type.
 *
 * @param error - The error to map
 * @returns A SimpleError object
 */
const mapToSimpleError = (error: unknown): SimpleError => ({
  message: error instanceof Error ? error.message : String(error),
});

/**
 * Error type for figlet rendering errors that includes the font name.
 */
interface FigletRenderError {
  message: string;
  fontName: string;
}

/**
 * Creates a mapper function for figlet rendering errors that includes the font name.
 *
 * @param fontName - The name of the font that caused the error
 * @returns A function that maps any error to a FigletRenderError
 */
const mapToFigletRenderError =
  (fontName: string) =>
  (error: unknown): FigletRenderError => ({
    message: error instanceof Error ? error.message : String(error),
    fontName,
  });

const defaultFigletFont = 'Standard';

/**
 * Yargonaut is a utility for enhancing yargs command-line interfaces with figlet fonts and chalk styles.
 * It allows you to apply ASCII art fonts to help messages, error messages, and other yargs output.
 */
export class Yargonaut {
  readonly #yargsInstance: YargsInstance;
  readonly #yargsKeyDefinitions: Record<string, YargsKeyConfig>;
  readonly #appliedConfigs: Record<string, AppliedConfig>;
  readonly #defaultFont: string;
  #outputCustomizationFunction?: OutputCustomizationFunction;

  /**
   * Creates a new Yargonaut instance.
   *
   * @param yargsInstance - A yargs instance with at least an 'updateLocale' method
   * @throws Error if the provided yargs instance is invalid
   */
  constructor(yargsInstance: unknown) {
    if (
      !yargsInstance ||
      typeof yargsInstance !== 'object' ||
      typeof (yargsInstance as YargsInstance).updateLocale !== 'function'
    ) {
      const message =
        "Yargonaut constructor requires a valid yargs instance with at least an 'updateLocale' method.";
      logger.error(message);
      throw new Error(message);
    }

    this.#yargsInstance = yargsInstance as YargsInstance;
    this.#yargsKeyDefinitions = { ...defaultYargsKeysConfig };
    this.#appliedConfigs = {};
    this.#outputCustomizationFunction = undefined;
    this.#defaultFont = defaultFigletFont;

    logger.info('Yargonaut initialized successfully.');
  }

  /**
   * Sets the logging level for Yargonaut's internal logger.
   * @param level The desired log level.
   * @returns The Yargonaut instance for chaining.
   */
  logLevel(level: LogLevel): this {
    logger.setLevel(level);
    return this;
  }

  /**
   * Apply a specific figlet font to all help messages.
   *
   * @param fontName - The name of the figlet font to use
   * @returns The Yargonaut instance for method chaining
   */
  help(fontName: string): this {
    this.#applyFont(fontName, getHelpKeys());
    return this;
  }

  /**
   * Apply a specific figlet font to all error messages.
   *
   * @param fontName - The name of the figlet font to use
   * @returns The Yargonaut instance for method chaining
   */
  errors(fontName: string): this {
    this.#applyFont(fontName, getErrorKeys());
    return this;
  }

  /**
   * Apply a specific figlet font to one or more `yargs` locale keys.
   * If `keys` is omitted, applies to all known help and error keys.
   *
   * @param fontName - The name of the figlet font to use
   * @param keys - Optional. A single key string or an array of key strings to apply the font to
   * @returns The Yargonaut instance for method chaining
   */
  font(fontName: string, keys?: string | string[]): this {
    const targetKeys = keys ? [keys].flat() : getAllKnownKeys();
    const forceTransform = keys !== undefined;
    this.#applyFont(fontName, targetKeys, forceTransform);
    return this;
  }

  /**
   * Apply a chalk style string to the titles of help sections (e.g., "Commands:", "Options:").
   *
   * @param styleString - A chalk style string (e.g., 'green', 'blue.bold')
   * @returns The Yargonaut instance for method chaining
   * @see {@link https://github.com/chalk/chalk#styles | Chalk documentation}
   */
  helpStyle(styleString: string): this {
    this.#applyStyle(styleString, getHelpKeys());
    return this;
  }

  /**
   * Apply a chalk style string to the titles of error messages.
   *
   * @param styleString - A chalk style string (e.g., 'red', 'yellow.underline')
   * @returns The Yargonaut instance for method chaining
   * @see {@link https://github.com/chalk/chalk#styles | Chalk documentation}
   */
  errorsStyle(styleString: string): this {
    this.#applyStyle(styleString, getErrorKeys());
    return this;
  }

  /**
   * Apply a chalk style string to one or more `yargs` locale keys.
   * If `keys` is omitted, applies to all known help and error keys.
   *
   * @param styleString - A chalk style string (e.g., 'green', 'blue.bold')
   * @param keys - Optional. A single key string or an array of key strings to apply the style to
   * @returns The Yargonaut instance for method chaining
   * @see {@link https://github.com/chalk/chalk#styles | Chalk documentation}
   */
  style(styleString: string, keys?: string | string[]): this {
    const targetKeys = keys ? [keys].flat() : getAllKnownKeys();
    this.#applyStyle(styleString, targetKeys);
    return this;
  }

  /**
   * Configures specified keys to have their entire string content rendered by figlet.
   * This applies when a font is applied via `.font()`, `.help()`, or `.errors()`.
   *
   * @param keys - Optional. Key(s) to apply this transform strategy to. If omitted, applies to all known keys
   * @returns The Yargonaut instance for method chaining
   */
  transformWholeString(keys?: string | string[]): this {
    const targetKeys = keys ? [keys].flat() : getAllKnownKeys();
    this.#applyTransform(transformWholeString, targetKeys);
    return this;
  }

  /**
   * Configures specified keys to have only the text up to and including the first colon
   * rendered by figlet when a font is applied. Text after the colon remains unchanged.
   * This is the default for many error messages.
   *
   * @param keys - Optional. Key(s) to apply this transform strategy to. If omitted, applies to all known keys
   * @returns The Yargonaut instance for method chaining
   */
  transformUpToFirstColon(keys?: string | string[]): this {
    const targetKeys = keys ? [keys].flat() : getAllKnownKeys();
    this.#applyTransform(transformUpToFirstColon, targetKeys);
    return this;
  }

  /**
   * Set a function to customize the output before it's sent to yargs.
   *
   * This lets you add your own final touches to the text after Yargonaut has applied
   * fonts and styles, but before the text is passed to yargs. Perfect for adding
   * extra decorations or making last-minute adjustments to the formatted text.
   *
   * @param customizationFunction - The function that will process the text, or undefined to remove a previously set function
   * @returns The Yargonaut instance for method chaining
   */
  customizeOutput(customizationFunction: OutputCustomizationFunction | undefined): this {
    if (customizationFunction === undefined || typeof customizationFunction === 'function') {
      this.#outputCustomizationFunction = customizationFunction;
      this.#updateYargsLocaleForAllAppliedKeys();
    } else {
      logger.warn('customizeOutput requires a function or undefined.');
      if (this.#outputCustomizationFunction != null) {
        this.#outputCustomizationFunction = undefined;
        this.#updateYargsLocaleForAllAppliedKeys();
      }
    }
    return this;
  }

  // --- Public Utility Methods ---

  /**
   * Renders a given text string using figlet with the specified font.
   *
   * @param text - The text string to render with figlet
   * @param fontName - Optional. The name of the figlet font to use. If omitted, the default font is used
   * @returns The rendered string, or the original string if there is an error
   */
  renderTextAsFont(text: string, fontName?: string): string {
    const effectiveFontName: string = fontName || this.#defaultFont;

    // Create the wrapped function
    const safeFigletTextSync = Result.fromThrowable(
      figlet.textSync,
      mapToFigletRenderError(effectiveFontName),
    );

    const options: Options = {
      font: effectiveFontName as Fonts,
    };

    // Call wrapped function and handle result
    const result = safeFigletTextSync(text, options);

    return result
      .mapErr((error) => {
        logger.warn(`Figlet error rendering with font "${error.fontName}": ${error.message}`);
        // We don't need to return the error itself from mapErr
        // if unwrapOr is providing the fallback value.
      })
      .unwrapOr(text); // Return original text on error
  }

  /**
   * Returns an array of available figlet font names.
   *
   * @returns Array of font names. If there is an error, an empty array is returned and the error is logged
   */
  listAvailableFonts(): string[] {
    // Create the wrapped function
    const safeFigletFontsSync = Result.fromThrowable(
      figlet.fontsSync, // Function to wrap
      mapToSimpleError, // Use generic error mapper
    );

    // Call wrapped function and handle result
    const result = safeFigletFontsSync();

    return result
      .mapErr((error) => {
        logger.error(`Could not retrieve figlet fonts: ${error.message}`);
      })
      .unwrapOr([]); // Return empty array on error
  }

  /**
   * Prints the given text rendered in the specified figlet font to the console.
   * This is useful for previewing the appearance of the configured fonts.
   *
   * @param fontName - Optional. The name of the figlet font to use. Defaults to the default font
   * @param text - Optional. The text to render. Defaults to the fontName
   */
  printTextInFont(fontName?: string, text?: string): void {
    const effectiveFont = fontName || this.#defaultFont;
    const textToRender = text || effectiveFont;
    logger.default(`Font: ${effectiveFont}\n${this.renderTextAsFont(textToRender, effectiveFont)}`);
  }

  /**
   * Prints the given text rendered in all available figlet fonts to the console.
   * This is useful for previewing the available fonts.
   *
   * @param text - Optional. The text to render in all available fonts. If omitted, renders the font name for each font
   */
  printTextInAllFonts(text?: string): void {
    for (const font of this.listAvailableFonts()) {
      this.printTextInFont(font, text);
    }
  }

  /**
   * Returns the figlet instance used by Yargonaut.
   * This can be used to render text directly with figlet.
   *
   * @returns The figlet instance
   */
  getFigletInstance(): typeof figlet {
    return figlet;
  }

  /**
   * Returns the chalk instance used by Yargonaut.
   * This can be used to style any string directly with chalk.
   *
   * @returns The chalk instance
   */
  getChalkInstance(): typeof chalk {
    return chalk;
  }

  // --- Private Helper Methods ---

  #ensureAppliedConfigExists(key: string): void {
    if (!this.#appliedConfigs[key]) {
      this.#appliedConfigs[key] = {};
    }
  }

  #applyStyle(styleString: string | undefined, keys: string[]): void {
    if (styleString !== undefined && typeof styleString !== 'string') {
      logger.warn('Style must be a string or undefined.');
      return;
    }
    const keysToUpdate: string[] = [];
    for (const key of keys) {
      if (this.#yargsKeyDefinitions[key]) {
        this.#ensureAppliedConfigExists(key);
        if (this.#appliedConfigs[key].style !== styleString) {
          this.#appliedConfigs[key].style = styleString;
          keysToUpdate.push(key);
        }
      } else {
        logger.warn(`Unknown yargs key "${key}" provided to style().`);
      }
    }

    if (keysToUpdate.length > 0) {
      this.#updateYargsLocaleForKeys(keysToUpdate);
    }
  }

  #applyFont(fontName: string | undefined, keys: string[], forceTransform = false): void {
    const effectiveFont =
      fontName === undefined || typeof fontName === 'string' ? fontName : this.#defaultFont;

    if (effectiveFont === undefined && !forceTransform) {
      // Clearing font
    } else if (typeof effectiveFont !== 'string') {
      logger.warn('Font name must be a string or undefined.');
      return;
    }

    const keysToUpdate: string[] = [];
    for (const key of keys) {
      const keyDefinition = this.#yargsKeyDefinitions[key];
      if (keyDefinition) {
        if (effectiveFont && keyDefinition.plural) {
          logger.warn(
            `Applying font "${effectiveFont}" to singular key "${key}". Fonts are not automatically applied to its plural form "${keyDefinition.plural}" due to potential formatting issues. Style the plural form separately if needed.`,
          );
        } else if (effectiveFont && keyDefinition.isPlural) {
          logger.warn(
            `Applying font "${effectiveFont}" to plural key "${key}" is not recommended and may break formatting. Apply fonts to singular keys instead.`,
          );
        }

        this.#ensureAppliedConfigExists(key);
        if (this.#appliedConfigs[key].font !== effectiveFont) {
          this.#appliedConfigs[key].font = effectiveFont;
          keysToUpdate.push(key);
        }

        if (
          effectiveFont &&
          forceTransform &&
          this.#appliedConfigs[key].transform == null &&
          keyDefinition.transform == null
        ) {
          this.#appliedConfigs[key].transform = transformWholeString;
          if (!keysToUpdate.includes(key)) keysToUpdate.push(key);
        }
      } else {
        logger.warn(`Unknown yargs key "${key}" provided to font().`);
      }
    }

    if (keysToUpdate.length > 0) {
      this.#updateYargsLocaleForKeys(keysToUpdate);
    }
  }

  #applyTransform(transformFunction: TransformFunction | undefined, keys: string[]): void {
    const keysToUpdate: string[] = [];
    for (const key of keys) {
      if (this.#yargsKeyDefinitions[key]) {
        this.#ensureAppliedConfigExists(key);
        if (this.#appliedConfigs[key].transform !== transformFunction) {
          this.#appliedConfigs[key].transform = transformFunction;
          if (this.#appliedConfigs[key].font) {
            keysToUpdate.push(key);
          }
        }
      } else {
        logger.warn(`Unknown yargs key "${key}" provided to transform().`);
      }
    }

    if (keysToUpdate.length > 0) {
      this.#updateYargsLocaleForKeys(keysToUpdate);
    }
  }

  #updateYargsLocaleForAllAppliedKeys(): void {
    this.#updateYargsLocaleForKeys(Object.keys(this.#appliedConfigs));
  }

  #getOriginalLocaleValue(key: string): string | { one: string; other: string } | undefined {
    const yargsInternal = this.#yargsInstance as any;

    if (typeof yargsInternal.getLocale === 'function') {
      try {
        const currentLocaleData = yargsInternal.getLocale();
        if (currentLocaleData && currentLocaleData[key] !== undefined) {
          return currentLocaleData[key];
        }
      } catch (error: any) {
        logger.warn(`Error calling yargsInstance.getLocale(): ${error?.message || error}`);
      }
    }

    if (yargsInternal.locales && typeof yargsInternal.locale === 'function') {
      try {
        const currentLocaleName = yargsInternal.locale();
        const localeData = yargsInternal.locales[currentLocaleName];
        if (localeData && localeData[key] !== undefined) {
          logger.debug(`Used internal locale access fallback for key "${key}".`);
          return localeData[key];
        }
      } catch (error: any) {
        logger.warn(`Error accessing internal locale data: ${error?.message || error}`);
      }
    }

    const defaultValue = defaultYargsStrings[key];
    if (defaultValue !== undefined) {
      logger.info(`Used Yargonaut's default string for key "${key}" as final fallback.`);
      return defaultValue;
    }

    logger.error(
      `Could not retrieve original value for key "${key}" from yargs instance or fallbacks. Yargonaut cannot reliably modify this key.`,
    );
    return undefined;
  }

  #updateYargsLocaleForKeys(keysToUpdate: string[]): void {
    if (keysToUpdate.length === 0) return;

    const localeUpdatePayload: Record<string, string | { one: string; other: string }> = {};
    const uniqueKeys = [...new Set(keysToUpdate)];

    for (const key of uniqueKeys) {
      const appliedConfig = this.#appliedConfigs[key];
      const keyDefinition = this.#yargsKeyDefinitions[key];

      if (!appliedConfig || !keyDefinition) continue;

      const originalValue = this.#getOriginalLocaleValue(key);
      if (originalValue === undefined) continue;

      let modifiedValue =
        typeof originalValue === 'object' ? structuredClone(originalValue) : originalValue;

      const font = appliedConfig.font;
      const transform = appliedConfig.transform ?? keyDefinition.transform;

      if (
        font &&
        transform != null &&
        typeof modifiedValue === 'string' &&
        !keyDefinition.isPlural
      ) {
        modifiedValue = this.#renderStringWithFont(modifiedValue, font, transform);
      }

      const style = appliedConfig.style;
      if (style) {
        modifiedValue = this.#renderStringWithStyle(modifiedValue, style);
      }

      if (this.#outputCustomizationFunction != null) {
        modifiedValue = this.#outputCustomizationFunction({
          key,
          originalString: originalValue,
          modifiedString: modifiedValue,
          figletInstance: figlet,
          fontName: font,
          styleString: style,
        });
      }

      if (JSON.stringify(modifiedValue) !== JSON.stringify(originalValue)) {
        localeUpdatePayload[key] = modifiedValue;
      }
    }

    if (Object.keys(localeUpdatePayload).length > 0) {
      logger.info(`Updating yargs locale for keys: ${Object.keys(localeUpdatePayload).join(', ')}`);

      // Wrap the updateLocale call
      const doUpdateLocale = (payload: typeof localeUpdatePayload) =>
        this.#yargsInstance.updateLocale(payload);

      const safeUpdateLocale = Result.fromThrowable(doUpdateLocale, mapToSimpleError);

      // Call the wrapped function and handle potential error
      const result = safeUpdateLocale(localeUpdatePayload);

      // eslint-disable-next-line neverthrow/must-use-result
      result.match(
        () => {
          // Ok case: updateLocale succeeded. No action needed here.
        },
        (error) => {
          logger.error(`Error calling yargsInstance.updateLocale(): ${error.message}`);
        },
      );
    }
  }

  #renderStringWithStyle(
    textOrObject: string | { one: string; other: string },
    styleString: string,
  ): string | { one: string; other: string } {
    if (typeof textOrObject === 'object' && textOrObject !== null) {
      return {
        one: this.#renderSingleStringWithStyle(textOrObject.one, styleString),
        other: this.#renderSingleStringWithStyle(textOrObject.other, styleString),
      };
    }
    return this.#renderSingleStringWithStyle(textOrObject, styleString);
  }

  #renderSingleStringWithStyle(text: string, styleString: string): string {
    let chalkChain: any = chalk;
    const parts = styleString.split('.').filter((part) => part.length > 0);

    for (const styleName of parts) {
      if (chalkChain && chalkChain[styleName] !== undefined) {
        chalkChain = chalkChain[styleName];
      } else {
        logger.warn(
          `Invalid chalk style component "${styleName}" in "${styleString}". Style may not be fully applied.`,
        );
        return typeof chalkChain === 'function' ? chalkChain(text) : text;
      }
    }
    return typeof chalkChain === 'function' ? chalkChain(text) : text;
  }

  #renderStringWithFont(
    originalString: string,
    fontName: string,
    transformFunction: TransformFunction,
  ): string {
    // No try/catch needed here as renderTextAsFont handles it
    const { renderPart, nonRenderPart } = transformFunction(originalString);
    // Use the public renderTextAsFont which includes error handling via fromThrowable
    const fontifiedText = this.renderTextAsFont(renderPart, fontName);
    return fontifiedText + nonRenderPart;
  }
}
