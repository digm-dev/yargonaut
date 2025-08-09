import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test';
import chalk from 'chalk';
import { hideBin } from 'yargs/helpers';
import yargsFn from 'yargs/yargs';
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

describe('Yargonaut Integration', () => {
  let originalArgv: string[];
  let yargsInstance: any;
  let yargonaut: Yargonaut;
  let mockUpdateLocale: any;

  beforeEach(() => {
    originalArgv = process.argv;
    process.argv = ['node', 'test'];
    yargsInstance = yargsFn(hideBin(process.argv));

    // --- Create and assign the mock updateLocale ---
    mockUpdateLocale = mock(() => yargsInstance);
    yargsInstance.updateLocale = mockUpdateLocale;
    // --- End mock setup ---

    yargonaut = new Yargonaut(yargsInstance);
  });

  afterEach(() => {
    process.argv = originalArgv;
    mock.restore();
  });

  it('should call updateLocale with correct payload', () => {
    // Configure yargonaut
    yargonaut.style('blue.bold', 'Commands:').help('Standard').errorsStyle('red');

    // Assertions on the mock function
    // Note: Calls happen sequentially as methods are chained

    // After .style('blue.bold', 'Commands:')
    expect(mockUpdateLocale).toHaveBeenCalledWith(
      expect.objectContaining({
        'Commands:': chalk.blue.bold('Commands:'),
      }),
    );

    // After .help('Standard')
    const helpCallArgs = mockUpdateLocale.mock.calls.find((call: any[]) => call[0]['Options:']); // Find call that includes 'Options:'
    expect(helpCallArgs).toBeDefined();
    expect(helpCallArgs[0]['Commands:']).toBeString(); // Should be figletized now
    expect(helpCallArgs[0]['Options:']).toBeString(); // Should be figletized

    // After .errorsStyle('red')
    const errorCallArgs = mockUpdateLocale.mock.calls.find(
      (call: any[]) => call[0]['Unknown argument: %s'],
    ); // Find call that includes an error key
    expect(errorCallArgs).toBeDefined();
    expect(errorCallArgs[0]['Unknown argument: %s']).toBe(chalk.red('Unknown argument: %s'));
    expect(errorCallArgs[0]['Missing required argument: %s']).toBe(
      chalk.red('Missing required argument: %s'),
    );

    // Check total calls if needed (depends on how many distinct updates occur)
    // expect(mockUpdateLocale).toHaveBeenCalledTimes(3); // Or however many separate updates happen
  });

  it('should apply custom output delegate and call updateLocale', () => {
    const delegate = mock(({ modifiedString }) => {
      const modifiedStr =
        typeof modifiedString === 'string' ? modifiedString : JSON.stringify(modifiedString);
      return `★ ${modifiedStr} ★`;
    });

    yargonaut.customizeOutput(delegate);
    yargonaut.style('blue', 'Commands:'); // Triggers update

    expect(delegate).toHaveBeenCalled();
    expect(mockUpdateLocale).toHaveBeenCalledWith(
      expect.objectContaining({
        'Commands:': expect.stringContaining('★'), // Check delegate modification
      }),
    );
    expect(mockUpdateLocale).toHaveBeenCalledWith(
      expect.objectContaining({
        'Commands:': expect.stringContaining(chalk.blue('Commands:')), // Check base style
      }),
    );
  });

  // Optional: Test actual output (more complex)
  // it('should produce styled help output', () => {
  //   yargonaut.style('green', 'Options:');
  //   const mockStdout = spyOn(process.stdout, 'write').mockImplementation(() => true);
  //   yargsInstance.help().parse('--help'); // Trigger help output
  //   expect(mockStdout).toHaveBeenCalledWith(expect.stringContaining(chalk.green('Options:')));
  //   mockStdout.mockRestore();
  // });
});
