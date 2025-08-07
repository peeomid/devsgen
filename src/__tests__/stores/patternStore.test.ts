import { describe, it, expect, beforeEach } from 'vitest';
import { 
  customRegexStore, 
  isPatternModifiedStore,
  setCustomRegex,
  resetCustomRegex,
  selectPattern
} from '../../stores/patternStore';

describe('Pattern Store - Custom Regex Functionality', () => {
  beforeEach(() => {
    // Reset stores before each test
    resetCustomRegex();
  });

  describe('Custom Regex State Management', () => {
    it('should initialize with empty custom regex', () => {
      const customRegex = customRegexStore.get();
      expect(customRegex.searchRegex).toBe('');
      expect(customRegex.replaceRegex).toBe('');
      expect(customRegex.flags).toBeUndefined();
      expect(isPatternModifiedStore.get()).toBe(false);
    });

    it('should set custom regex and mark pattern as modified', () => {
      const searchRegex = '\\d+';
      const replaceRegex = 'NUMBER';
      const flags = 'g';

      setCustomRegex(searchRegex, replaceRegex, flags);

      const customRegex = customRegexStore.get();
      expect(customRegex.searchRegex).toBe(searchRegex);
      expect(customRegex.replaceRegex).toBe(replaceRegex);
      expect(customRegex.flags).toBe(flags);
      expect(isPatternModifiedStore.get()).toBe(true);
    });

    it('should set custom regex without flags', () => {
      const searchRegex = '\\w+';
      const replaceRegex = 'WORD';

      setCustomRegex(searchRegex, replaceRegex);

      const customRegex = customRegexStore.get();
      expect(customRegex.searchRegex).toBe(searchRegex);
      expect(customRegex.replaceRegex).toBe(replaceRegex);
      expect(customRegex.flags).toBeUndefined();
      expect(isPatternModifiedStore.get()).toBe(true);
    });

    it('should reset custom regex to original state', () => {
      // First set custom regex
      setCustomRegex('test', 'replacement', 'i');
      expect(isPatternModifiedStore.get()).toBe(true);

      // Then reset
      resetCustomRegex();

      const customRegex = customRegexStore.get();
      expect(customRegex.searchRegex).toBe('');
      expect(customRegex.replaceRegex).toBe('');
      expect(customRegex.flags).toBeUndefined();
      expect(isPatternModifiedStore.get()).toBe(false);
    });
  });


  describe('Pattern Selection Integration', () => {
    it('should reset custom regex when selecting a new pattern', () => {
      // Set custom regex first
      setCustomRegex('old', 'pattern', 'g');
      
      expect(isPatternModifiedStore.get()).toBe(true);

      // Select a new pattern
      selectPattern('new-pattern-id');

      // Should reset custom regex
      const customRegex = customRegexStore.get();
      expect(customRegex.searchRegex).toBe('');
      expect(customRegex.replaceRegex).toBe('');
      expect(customRegex.flags).toBeUndefined();
      expect(isPatternModifiedStore.get()).toBe(false);
    });
  });
});