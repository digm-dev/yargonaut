/**
 * Yargonaut - Enhance your yargs CLI with figlet fonts and chalk styles
 *
 * This file exports the main Yargonaut class and all public types
 */

// Export the main class
export { Yargonaut } from './yargonaut';

// Export types from yargonaut.ts
export type {
  TransformFunction,
  OutputCustomizationFunction,
  OutputCustomizationParams,
} from './yargonaut';

// Export types and utilities from yargs-keys.ts
export type { YargsKeyConfig } from './yargs-keys';
export {
  transformWholeString,
  transformUpToFirstColon,
  getAllKnownKeys,
  getHelpKeys,
  getErrorKeys,
} from './yargs-keys';
