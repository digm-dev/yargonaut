// yargonaut.spec.ts

import { afterEach, beforeEach, describe, expect, it, mock, spyOn } from 'bun:test';
import chalk from 'chalk';
import { hideBin } from 'yargs/helpers';
import yargsFn from 'yargs/yargs';
import { logger } from '../logger';
import { Yargonaut } from '../yargonaut';

// Mock the logger to prevent console output and spy on its methods
void mock.module('../logger', () => ({
  logger: {
    setLevel: mock(),
    debug: mock(),
    info: mock(),
    error: mock(),
    warn: mock(),
    default: mock(),
    step: mock(),
    bold: mock(),
  },
}));

describe('Yargonaut', () => {
  let yargonaut: Yargonaut;
  let yargsInstance: any;
  let mockUpdateLocale: any;

  beforeEach(() => {
    process.argv = ['bun', 'test'];
    yargsInstance = yargsFn(hideBin(process.argv));

    // --- Use spyOn to mock updateLocale ---
    mockUpdateLocale = spyOn(yargsInstance, 'updateLocale').mockImplementation(
      () => yargsInstance, // Mock returns instance for chaining
    );
    // --- End mock setup ---

    yargonaut = new Yargonaut(yargsInstance);
  });

  afterEach(() => {
    mock.restore();
  });

  describe('Constructor', () => {
    it('should initialize with a valid yargs instance', () => {
      expect(yargonaut).toBeDefined();
    });

    it('should throw an error with invalid yargs instance', () => {
      // Need to mock updateLocale even for invalid instances if the check happens later
      const invalidInstance = {};
      expect(() => new Yargonaut(invalidInstance)).toThrow();
      expect(() => new Yargonaut(null)).toThrow();
      expect(() => new Yargonaut(undefined)).toThrow();
    });
  });

  describe('Style methods', () => {
    it('should call updateLocale with styled key for .style()', () => {
      const result = yargonaut.style('blue.bold', 'Commands:');
      expect(result).toBe(yargonaut);

      // Verify updateLocale was called correctly
      expect(mockUpdateLocale).toHaveBeenCalledTimes(1);
      expect(mockUpdateLocale).toHaveBeenCalledWith({
        // Use chalk to generate the expected styled string
        'Commands:': chalk.blue.bold('Commands:'),
      });
    });

    it('should call updateLocale with styled help keys for .helpStyle()', () => {
      const result = yargonaut.helpStyle('green');
      expect(result).toBe(yargonaut);

      expect(mockUpdateLocale).toHaveBeenCalledTimes(1);
      // Check that the payload contains styled help keys
      const expectedPayload = expect.objectContaining({
        'Commands:': chalk.green('Commands:'),
        'Options:': chalk.green('Options:'),
        // Add other help keys if needed
      });
      expect(mockUpdateLocale).toHaveBeenCalledWith(expectedPayload);
    });

    it('should call updateLocale with styled error keys for .errorsStyle()', () => {
      const result = yargonaut.errorsStyle('red');
      expect(result).toBe(yargonaut);

      expect(mockUpdateLocale).toHaveBeenCalledTimes(1);
      // Check that the payload contains styled error keys
      const expectedPayload = expect.objectContaining({
        'Unknown argument: %s': chalk.red('Unknown argument: %s'),
        'Missing required argument: %s': chalk.red('Missing required argument: %s'),
        // Add other error keys if needed
      });
      expect(mockUpdateLocale).toHaveBeenCalledWith(expectedPayload);
    });
  });

  describe('logLevel method', () => {
    it('should call logger.setLevel with the provided level', () => {
      const result = yargonaut.logLevel('silent');
      expect(result).toBe(yargonaut); // Ensure it's chainable

      // Verify logger.setLevel was called correctly
      expect(logger.setLevel).toHaveBeenCalledTimes(1);
      expect(logger.setLevel).toHaveBeenCalledWith('silent');
    });
  });

  describe('Font methods', () => {
    // Helper to check if string looks like figlet output (basic check)
    const isFigletOutput = (str: string, original: string): boolean => {
      return typeof str === 'string' && str.length > original.length && str.includes('\n');
    };

    it('should call updateLocale with figletized key for .font()', () => {
      const result = yargonaut.font('Standard', 'Commands:');
      expect(result).toBe(yargonaut);

      expect(mockUpdateLocale).toHaveBeenCalledTimes(1);
      const payload = mockUpdateLocale.mock.calls[0][0];
      expect(payload['Commands:']).toBeDefined();
      expect(isFigletOutput(payload['Commands:'], 'Commands:')).toBe(true);
    });

    it('should call updateLocale with figletized help keys for .help()', () => {
      const result = yargonaut.help('Standard');
      expect(result).toBe(yargonaut);

      expect(mockUpdateLocale).toHaveBeenCalledTimes(1);
      const payload = mockUpdateLocale.mock.calls[0][0];
      expect(payload['Commands:']).toBeDefined();
      expect(isFigletOutput(payload['Commands:'], 'Commands:')).toBe(true);
      expect(payload['Options:']).toBeDefined();
      expect(isFigletOutput(payload['Options:'], 'Options:')).toBe(true);
      // Add other help keys if needed
    });

    it('should call updateLocale with figletized error keys for .errors()', () => {
      // Note: Fonts on error keys with transforms might only affect part of the string
      const result = yargonaut.errors('Standard');
      expect(result).toBe(yargonaut);

      expect(mockUpdateLocale).toHaveBeenCalledTimes(1);
      const payload = mockUpdateLocale.mock.calls[0][0];
      // Example: 'Unknown argument: %s' uses transformUpToFirstColon
      const original = 'Unknown argument: %s';
      const expectedRenderPart = 'Unknown argument:';
      expect(payload[original]).toBeDefined();
      // Check that the beginning looks like figlet output
      expect(
        payload[original].startsWith(yargonaut.renderTextAsFont(expectedRenderPart, 'Standard')),
      ).toBe(true);
      // Check that the non-render part is appended
      expect(payload[original].endsWith('\n  %s')).toBe(true);
    });
  });

  describe('Transform methods', () => {
    it('should use transformWholeString when set before font', () => {
      yargonaut.transformWholeString(['Commands:']);
      yargonaut.font('Standard', 'Commands:');

      expect(mockUpdateLocale).toHaveBeenCalledTimes(1);
      const payload = mockUpdateLocale.mock.calls[0][0]; // Check the first (and only)
      expect(payload['Commands:']).toBeDefined();
      // Verify the payload reflects the transform + font
      expect(payload['Commands:']).toBe(yargonaut.renderTextAsFont('Commands:', 'Standard'));
    });

    it('should use transformUpToFirstColon when set before font', () => {
      yargonaut.transformUpToFirstColon(['Unknown argument: %s']);
      yargonaut.font('Standard', 'Unknown argument: %s');

      expect(mockUpdateLocale).toHaveBeenCalledTimes(1);
      const payload = mockUpdateLocale.mock.calls[0][0];
      const original = 'Unknown argument: %s';
      const expectedRenderPart = 'Unknown argument:';
      expect(payload[original]).toBeDefined();
      expect(
        payload[original].startsWith(yargonaut.renderTextAsFont(expectedRenderPart, 'Standard')),
      ).toBe(true);
      expect(payload[original].endsWith('\n  %s')).toBe(true);
    });
  });

  // --- Utility methods tests remain mostly the same ---
  describe('Utility methods', () => {
    it('should render text as font', () => {
      const rendered = yargonaut.renderTextAsFont('test', 'Standard');
      expect(typeof rendered).toBe('string');
      expect(rendered.length).toBeGreaterThan(4);
    });

    it('should list available fonts', () => {
      const fonts = yargonaut.listAvailableFonts();
      expect(Array.isArray(fonts)).toBe(true);
      expect(fonts.length).toBeGreaterThan(0);
      expect(fonts).toContain('Standard');
    });

    it('should get figlet instance', () => {
      const figlet = yargonaut.getFigletInstance();
      expect(figlet).toBeDefined();
      expect(typeof figlet.textSync).toBe('function');
    });

    it('should get chalk instance', () => {
      const chalk = yargonaut.getChalkInstance();
      expect(chalk).toBeDefined();
      expect(typeof chalk.blue).toBe('function');
    });
  });

  describe('Output customization delegate', () => {
    it('should set and use output customization delegate', () => {
      const delegate = mock(({ modifiedString }) => {
        // Use prefixed args
        return `Custom_${modifiedString}`;
      });

      yargonaut.customizeOutput(delegate);
      yargonaut.style('blue', 'Commands:'); // This triggers updateLocale

      // Verify delegate was called *during* the updateLocale process
      expect(delegate).toHaveBeenCalled();

      // Check that the customized value was passed to updateLocale
      expect(mockUpdateLocale).toHaveBeenCalledTimes(1); // Called by .style()
      const payload = mockUpdateLocale.mock.calls[0][0];
      expect(payload['Commands:']).toContain('Custom_');
      // Check that the base styling was also applied before the delegate
      expect(payload['Commands:']).toContain(chalk.blue('Commands:'));
    });

    it('should handle undefined delegate', () => {
      yargonaut.customizeOutput(undefined);
      // Apply style, which triggers updateLocale
      yargonaut.style('blue', 'Commands:');
      // Check updateLocale was called without error and without custom prefix
      expect(mockUpdateLocale).toHaveBeenCalledTimes(1);
      const payload = mockUpdateLocale.mock.calls[0][0];
      expect(payload['Commands:']).not.toContain('Custom_');
      expect(payload['Commands:']).toBe(chalk.blue('Commands:'));
    });
  });
});
