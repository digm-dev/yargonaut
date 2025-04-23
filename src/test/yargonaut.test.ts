// main.js (using the compiled JS output)

import { hideBin } from 'yargs/helpers';
import yargsFn from 'yargs/yargs';
import { Yargonaut } from '../yargonaut.ts';

// 1. Initialize Yargonaut WITH the yargs instance
const yargsInstance = yargsFn(hideBin(process.argv));

const yargonaut = new Yargonaut(yargsInstance);

// 2. Configure styles and fonts
yargonaut
  .style('blue.bold', 'Commands:') // Style specific key
  .help('Big') // Font for all help keys
  .errorsStyle('red'); // Style for all error keys

// Example of custom delegate
yargonaut.customizeOutput(({ key, modifiedString, fontName, styleString }) => {
  if (typeof modifiedString === 'string') {
    return `✨ ${modifiedString} ✨`; // Add sparkles
  }
  return modifiedString; // Don't modify plurals further here
});

// 3. Define your yargs commands and options as usual
// Explicitly mark as void to handle floating promise
void yargsInstance
  .command('serve [port]', 'start the server', (y) => {
    y.positional('port', {
      describe: 'port to bind on',
      default: 5000,
      type: 'number',
    });
  })
  .option('verbose', {
    alias: 'v',
    type: 'boolean',
    description: 'Run with verbose logging',
  })
  .demandCommand(1, 'You need at least one command before moving on')
  .help().argv; // help() triggers output generation using the modified locale

// Yargonaut automatically called yargs.updateLocale() when you used .style(), .help(), etc.
