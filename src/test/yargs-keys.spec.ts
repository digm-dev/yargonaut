import { describe, expect, it } from 'bun:test';
import {
  defaultYargsKeysConfig,
  defaultYargsStrings,
  getAllKnownKeys,
  getErrorKeys,
  getHelpKeys,
  transformUpToFirstColon,
  transformWholeString,
} from '../yargs-keys';

describe('yargs-keys', () => {
  describe('defaultYargsKeysConfig', () => {
    it('should define configuration for all known yargs keys', () => {
      expect(defaultYargsKeysConfig).toBeDefined();
      expect(Object.keys(defaultYargsKeysConfig).length).toBeGreaterThan(0);
    });

    it('should have proper configuration for help keys', () => {
      expect(defaultYargsKeysConfig['Commands:']).toBeDefined();
      expect(defaultYargsKeysConfig['Commands:'].error).toBe(false);

      expect(defaultYargsKeysConfig['Options:']).toBeDefined();
      expect(defaultYargsKeysConfig['Options:'].error).toBe(false);
    });

    it('should have proper configuration for error keys', () => {
      expect(defaultYargsKeysConfig['Unknown argument: %s']).toBeDefined();
      expect(defaultYargsKeysConfig['Unknown argument: %s'].error).toBe(true);

      expect(defaultYargsKeysConfig['Missing required argument: %s']).toBeDefined();
      expect(defaultYargsKeysConfig['Missing required argument: %s'].error).toBe(true);
    });

    it('should properly mark plural forms', () => {
      expect(defaultYargsKeysConfig['Unknown arguments: %s']).toBeDefined();
      expect(defaultYargsKeysConfig['Unknown arguments: %s'].isPlural).toBe(true);
    });

    it('should link singular and plural forms', () => {
      expect(defaultYargsKeysConfig['Unknown argument: %s'].plural).toBe('Unknown arguments: %s');
      expect(defaultYargsKeysConfig['Missing required argument: %s'].plural).toBe(
        'Missing required arguments: %s',
      );
    });
  });

  describe('defaultYargsStrings', () => {
    it('should define default strings for all known yargs keys', () => {
      expect(defaultYargsStrings).toBeDefined();
      expect(Object.keys(defaultYargsStrings).length).toBeGreaterThan(0);
    });

    it('should have proper string values for simple keys', () => {
      expect(defaultYargsStrings['Commands:']).toBe('Commands:');
      expect(defaultYargsStrings['Options:']).toBe('Options:');
    });

    it('should have proper object values for plural keys', () => {
      const pluralKey = 'Unknown arguments: %s';
      expect(defaultYargsStrings[pluralKey]).toBeObject();
      const pluralValue = defaultYargsStrings[pluralKey] as { one: string; other: string };
      expect(pluralValue.one).toBe('Unknown argument: %s');
      expect(pluralValue.other).toBe('Unknown arguments: %s');
    });
  });

  describe('Helper functions', () => {
    it('getAllKnownKeys should return all non-plural keys', () => {
      const allKeys = getAllKnownKeys();
      expect(allKeys).toBeArray();
      expect(allKeys.length).toBeGreaterThan(0);

      // Should not include plural forms
      expect(allKeys).not.toContain('Unknown arguments: %s');
      expect(allKeys).toContain('Unknown argument: %s');
    });

    it('getHelpKeys should return only help keys', () => {
      const helpKeys = getHelpKeys();
      expect(helpKeys).toBeArray();
      expect(helpKeys.length).toBeGreaterThan(0);

      // Should include help keys but not error keys
      expect(helpKeys).toContain('Commands:');
      expect(helpKeys).not.toContain('Unknown argument: %s');
    });

    it('getErrorKeys should return only error keys', () => {
      const errorKeys = getErrorKeys();
      expect(errorKeys).toBeArray();
      expect(errorKeys.length).toBeGreaterThan(0);

      // Should include error keys but not help keys
      expect(errorKeys).toContain('Unknown argument: %s');
      expect(errorKeys).not.toContain('Commands:');
    });
  });

  describe('Transform functions', () => {
    it('transformWholeString should return the entire string as renderPart', () => {
      const result = transformWholeString('Test string');
      expect(result.renderPart).toBe('Test string');
      expect(result.nonRenderPart).toBe('');
    });

    it('transformUpToFirstColon should split at first colon', () => {
      const result = transformUpToFirstColon('Header: Content');
      expect(result.renderPart).toBe('Header:');
      expect(result.nonRenderPart).toBe('\n  Content');
    });

    it('transformUpToFirstColon should handle strings without colons', () => {
      const result = transformUpToFirstColon('No colon here');
      expect(result.renderPart).toBe('No colon here');
      expect(result.nonRenderPart).toBe('');
    });
  });
});
