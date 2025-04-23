// yargs-keys.ts
// Defines the default structure and properties of yargs localization keys
// that Yargonaut recognizes.

// Define transform functions (can be moved to a separate file if preferred)
function transformWholeString(text: string): {
  renderPart: string;
  nonRenderPart: string;
} {
  return { renderPart: text, nonRenderPart: '' };
}

function transformUpToFirstColon(text: string): {
  renderPart: string;
  nonRenderPart: string;
} {
  const firstColonIndex = text.indexOf(':');
  if (firstColonIndex === -1) {
    return { renderPart: text, nonRenderPart: '' };
  }
  const renderPart = text.slice(0, Math.max(0, firstColonIndex + 1));
  const nonRenderPart = `\n  ${text.slice(Math.max(0, firstColonIndex + 1)).trim()}`;
  return { renderPart, nonRenderPart };
}

export type TransformFunction = (text: string) => { renderPart: string; nonRenderPart: string };

export interface YargsKeyConfig {
  transform?: TransformFunction; // How to split the string for figlet rendering
  error?: boolean; // Is this key typically used for errors? (true/false/undefined)
  plural?: string; // The corresponding plural key string, if applicable
  isPlural?: boolean; // Internal flag to mark if this *is* a plural form
}

export const defaultYargsStrings: Record<string, string | { one: string; other: string }> = {
  'Commands:': 'Commands:',
  'Options:': 'Options:',
  'Examples:': 'Examples:',
  'Positionals:': 'Positionals:',
  'Not enough non-option arguments: got %s, need at least %s':
    'Not enough non-option arguments: got %s, need at least %s',
  'Too many non-option arguments: got %s, maximum of %s':
    'Too many non-option arguments: got %s, maximum of %s',
  'Missing argument value: %s': 'Missing argument value: %s',
  'Missing required argument: %s': 'Missing required argument: %s',
  'Unknown argument: %s': 'Unknown argument: %s',
  'Invalid values:': 'Invalid values:',
  'Argument check failed: %s': 'Argument check failed: %s',
  'Implications failed:': 'Implications failed:',
  'Not enough arguments following: %s': 'Not enough arguments following: %s',
  'Invalid JSON config file: %s': 'Invalid JSON config file: %s',
  'Did you mean %s?': 'Did you mean %s?',
  'Arguments %s and %s are mutually exclusive': 'Arguments %s and %s are mutually exclusive',
  boolean: 'boolean',
  count: 'count',
  string: 'string',
  number: 'number',
  array: 'array',
  required: 'required',
  'default:': 'default:',
  'choices:': 'choices:',
  'aliases:': 'aliases:',
  'generated-value': 'generated-value',
  'Argument: %s, Given: %s, Choices: %s': 'Argument: %s, Given: %s, Choices: %s',

  // Plural Forms (as objects, matching yargs structure)
  'Missing argument values: %s': {
    one: 'Missing argument value: %s',
    other: 'Missing argument values: %s',
  },
  'Missing required arguments: %s': {
    one: 'Missing required argument: %s',
    other: 'Missing required arguments: %s',
  },
  'Unknown arguments: %s': {
    one: 'Unknown argument: %s',
    other: 'Unknown arguments: %s',
  },
};

// Base configuration for known yargs keys
export const defaultYargsKeysConfig: Record<string, YargsKeyConfig> = {
  // Keys supporting fonts and styles by default
  'Commands:': { transform: transformWholeString, error: false },
  'Options:': { transform: transformWholeString, error: false },
  'Examples:': { transform: transformWholeString, error: false },
  'Positionals:': { transform: transformWholeString, error: false },
  'Not enough non-option arguments: got %s, need at least %s': {
    transform: transformUpToFirstColon,
    error: true,
  },
  'Too many non-option arguments: got %s, maximum of %s': {
    transform: transformUpToFirstColon,
    error: true,
  },
  'Missing argument value: %s': {
    transform: transformUpToFirstColon,
    error: true,
    plural: 'Missing argument values: %s',
  },
  'Missing required argument: %s': {
    transform: transformUpToFirstColon,
    error: true,
    plural: 'Missing required arguments: %s',
  },
  'Unknown argument: %s': {
    transform: transformUpToFirstColon,
    error: true,
    plural: 'Unknown arguments: %s',
  },
  'Invalid values:': { transform: transformWholeString, error: true },
  'Argument check failed: %s': {
    transform: transformUpToFirstColon,
    error: true,
  },
  'Implications failed:': {
    transform: transformWholeString,
    error: true,
  },
  'Not enough arguments following: %s': {
    transform: transformUpToFirstColon,
    error: true,
  },
  'Invalid JSON config file: %s': {
    transform: transformUpToFirstColon,
    error: true,
  },
  'Did you mean %s?': { transform: transformWholeString, error: true },
  'Arguments %s and %s are mutually exclusive': {
    transform: transformWholeString,
    error: true,
  },
  // Keys supporting styles only by default (no default transform)
  boolean: {},
  count: {},
  string: {},
  number: {},
  array: {},
  required: {},
  'default:': {},
  'choices:': {},
  'aliases:': {},
  'generated-value': {},
  'Argument: %s, Given: %s, Choices: %s': { error: true },

  // --- Plural forms (marked internally) ---
  'Missing argument values: %s': { isPlural: true, error: true },
  'Missing required arguments: %s': { isPlural: true, error: true },
  'Unknown arguments: %s': { isPlural: true, error: true },
};

// Helper functions to get key lists based on config
export function getAllKnownKeys(): string[] {
  return Object.keys(defaultYargsKeysConfig).filter((key) => !defaultYargsKeysConfig[key].isPlural); // Exclude plural forms from direct targeting
}

export function getHelpKeys(): string[] {
  return getAllKnownKeys().filter((key) => defaultYargsKeysConfig[key]?.error === false);
}

export function getErrorKeys(): string[] {
  return getAllKnownKeys().filter((key) => defaultYargsKeysConfig[key]?.error === true);
}

// Add the transform functions to the export if they are kept in this file
export { transformWholeString, transformUpToFirstColon };
