import { describe, it, expect, beforeEach } from 'vitest';
import { RegexService } from '../../services/RegexService';
import type { Pattern } from '../../types/pattern';

describe('RegexService', () => {
  let regexService: RegexService;

  beforeEach(() => {
    regexService = new RegexService();
  });

  describe('pattern registration', () => {
    it('should register a pattern successfully', () => {
      expect(() => {
        regexService.registerPattern('test-pattern', 'test', 'result', 'g');
      }).not.toThrow();

      expect(regexService.hasPattern('test-pattern')).toBe(true);
    });

    it('should throw error for invalid regex during registration', () => {
      expect(() => {
        regexService.registerPattern('invalid-pattern', '(', 'result', 'g');
      }).toThrow('Invalid search regex');
    });

    it('should register multiple patterns at once', () => {
      const patterns: Pattern[] = [
        {
          id: 'pattern-1',
          keyNumber: 1,
          shortKeys: [],
          name: 'Pattern 1',
          description: 'First pattern',
          category: 'Format Conversion',
          searchRegex: 'test1',
          replaceRegex: 'result1',
          flags: 'g',
          example: { input: 'test1', output: 'result1' },
          isBuiltIn: true,
          tags: [],
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z'
        },
        {
          id: 'pattern-2',
          keyNumber: 2,
          shortKeys: [],
          name: 'Pattern 2',
          description: 'Second pattern',
          category: 'Format Conversion',
          searchRegex: 'test2',
          replaceRegex: 'result2',
          flags: 'g',
          example: { input: 'test2', output: 'result2' },
          isBuiltIn: true,
          tags: [],
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z'
        }
      ];

      regexService.registerPatterns(patterns);

      expect(regexService.hasPattern('pattern-1')).toBe(true);
      expect(regexService.hasPattern('pattern-2')).toBe(true);
    });

    it('should get a registered pattern', () => {
      regexService.registerPattern('test-pattern', 'test', 'result', 'g');
      
      const pattern = regexService.getPattern('test-pattern');
      
      expect(pattern).toEqual({
        searchRegex: 'test',
        replaceRegex: 'result',
        flags: 'g'
      });
    });

    it('should return undefined for non-existent pattern', () => {
      const pattern = regexService.getPattern('non-existent');
      expect(pattern).toBeUndefined();
    });

    it('should clear all patterns', () => {
      regexService.registerPattern('pattern-1', 'test1', 'result1', 'g');
      regexService.registerPattern('pattern-2', 'test2', 'result2', 'g');
      
      regexService.clearPatterns();
      
      expect(regexService.hasPattern('pattern-1')).toBe(false);
      expect(regexService.hasPattern('pattern-2')).toBe(false);
    });
  });

  describe('basic transformations', () => {
    beforeEach(() => {
      regexService.registerPattern('simple-replace', 'hello', 'hi', 'g');
      regexService.registerPattern('word-boundary', '\\btest\\b', 'result', 'g');
      regexService.registerPattern('capture-groups', '(\\w+)\\s+(\\w+)', '$2 $1', 'g');
    });

    it('should transform text using a registered pattern', () => {
      const result = regexService.transform('simple-replace', 'hello world hello');
      expect(result).toBe('hi world hi');
    });

    it('should handle word boundaries correctly', () => {
      const result = regexService.transform('word-boundary', 'test testing test');
      expect(result).toBe('result testing result');
    });

    it('should handle capture groups', () => {
      const result = regexService.transform('capture-groups', 'John Doe');
      expect(result).toBe('Doe John');
    });

    it('should throw error for non-existent pattern', () => {
      expect(() => {
        regexService.transform('non-existent', 'test input');
      }).toThrow('Pattern not found: non-existent');
    });
  });

  describe('direct regex transformations', () => {
    it('should transform using provided regex patterns', () => {
      const result = regexService.transformWithRegex('hello world', 'hello', 'hi', 'g');
      expect(result).toBe('hi world');
    });

    it('should use global flag by default', () => {
      const result = regexService.transformWithRegex('test test test', 'test', 'pass');
      expect(result).toBe('pass pass pass');
    });

    it('should respect custom flags', () => {
      const result = regexService.transformWithRegex('Hello hello HELLO', 'hello', 'hi', 'gi');
      expect(result).toBe('hi hi hi');
    });

    it('should handle empty replacement', () => {
      const result = regexService.transformWithRegex('remove this text', 'this ', '');
      expect(result).toBe('remove text');
    });

    it('should throw error for invalid regex', () => {
      expect(() => {
        regexService.transformWithRegex('test', '(', 'result');
      }).toThrow('Transformation error');
    });

    it('should handle special regex characters', () => {
      const result = regexService.transformWithRegex('a.b.c', '\\.', '-', 'g');
      expect(result).toBe('a-b-c');
    });
  });

  describe('extraction functionality', () => {
    it('should extract matches from text', () => {
      const result = regexService.extractMatches(
        'Contact john@test.com or jane@example.org for help',
        '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}',
        'g'
      );
      
      expect(result).toBe('john@test.com\njane@example.org\n');
    });

    it('should return empty string when no matches found', () => {
      const result = regexService.extractMatches('no emails here', '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}', 'g');
      expect(result).toBe('');
    });

    it('should handle single match', () => {
      const result = regexService.extractMatches('Visit https://example.com', 'https?://[^\\s]+', 'g');
      expect(result).toBe('https://example.com\n');
    });

    it('should throw error for invalid regex', () => {
      expect(() => {
        regexService.extractMatches('test', '(', 'g');
      }).toThrow('Extraction error');
    });
  });

  describe('special case transformations', () => {
    beforeEach(() => {
      regexService.registerPattern('extract-urls', '(https?://[^\\s,;!()]+)', '$1\n', 'g');
      regexService.registerPattern('extract-emails', '([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,})', '$1\n', 'g');
      regexService.registerPattern('kebab-to-camel', '-([a-z])', '', 'g');
      regexService.registerPattern('camel-to-kebab', '([a-z])([A-Z])', '$1-$2', 'g');
      regexService.registerPattern('path-slash-to-dot', '/', '.', 'g');
    });

    it('should handle URL extraction specially', () => {
      const input = 'Visit https://example.com and https://test.org';
      const result = regexService.transform('extract-urls', input);
      
      expect(result).toBe('https://example.com\nhttps://test.org\n');
    });

    it('should handle email extraction specially', () => {
      const input = 'Contact john@test.com or jane@example.org';
      const result = regexService.transform('extract-emails', input);
      
      expect(result).toBe('john@test.com\njane@example.org\n');
    });

    it('should handle kebab-to-camel conversion', () => {
      const result = regexService.transform('kebab-to-camel', 'my-variable-name');
      expect(result).toBe('myVariableName');
    });

    it('should handle camel-to-kebab conversion', () => {
      const result = regexService.transform('camel-to-kebab', 'myVariableName');
      expect(result).toBe('my-variable-name');
    });

    it('should handle path slash-to-dot conversion', () => {
      const result = regexService.transform('path-slash-to-dot', 'app/services/user');
      expect(result).toBe('app.services.user');
    });
  });

  describe('regex validation', () => {
    it('should validate correct regex patterns', () => {
      const validPatterns = [
        'simple',
        '\\\\d+',
        '[a-zA-Z]+',
        '(\\\\w+)\\\\s+(\\\\w+)',
        '^start.*end$',
        'test|example'
      ];

      validPatterns.forEach(pattern => {
        const result = regexService.validateRegex(pattern);
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    it('should invalidate incorrect regex patterns', () => {
      const invalidPatterns = [
        '(',
        '[',
        '(?',
        '(?P',
        '\\',
        '**'
      ];

      invalidPatterns.forEach(pattern => {
        const result = regexService.validateRegex(pattern);
        expect(result.isValid).toBe(false);
        expect(result.error).toBeDefined();
      });
    });

    it('should provide meaningful error messages', () => {
      const result = regexService.validateRegex('(');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid regular expression');
    });
  });

  describe('performance and edge cases', () => {
    it('should handle large input text efficiently', () => {
      regexService.registerPattern('large-test', 'test', 'result', 'g');
      
      const largeInput = 'test '.repeat(10000);
      const startTime = performance.now();
      
      const result = regexService.transform('large-test', largeInput);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(result).toBe('result '.repeat(10000));
      expect(duration).toBeLessThan(100); // Should complete within 100ms
    });

    it('should handle empty input', () => {
      regexService.registerPattern('empty-test', 'test', 'result', 'g');
      
      const result = regexService.transform('empty-test', '');
      expect(result).toBe('');
    });

    it('should handle patterns with no matches', () => {
      regexService.registerPattern('no-match', 'xyz', 'result', 'g');
      
      const result = regexService.transform('no-match', 'hello world');
      expect(result).toBe('hello world');
    });

    it('should handle complex nested capture groups', () => {
      const result = regexService.transformWithRegex(
        'function myFunc() { return true; }',
        'function\\s+(\\w+)\\(\\)\\s*\\{\\s*return\\s+(\\w+);\\s*\\}',
        'const $1 = () => $2;',
        'g'
      );
      
      expect(result).toBe('const myFunc = () => true;');
    });

    it('should handle unicode characters', () => {
      const result = regexService.transformWithRegex(
        'Hello 世界 and Здравствуй',
        '世界',
        'World',
        'g'
      );
      
      expect(result).toBe('Hello World and Здравствуй');
    });

    it('should handle multiline text', () => {
      const input = 'line1\nline2\nline3';
      const result = regexService.transformWithRegex(input, '^line', 'row', 'gm');
      
      expect(result).toBe('row1\nrow2\nrow3');
    });
  });

  describe('error handling', () => {
    it('should handle transformation errors gracefully', () => {
      expect(() => {
        regexService.transformWithRegex('test', '(', 'result');
      }).toThrow('Transformation error');
    });

    it('should handle extraction errors gracefully', () => {
      expect(() => {
        regexService.extractMatches('test', '(', 'g');
      }).toThrow('Extraction error');
    });

    it('should handle unknown errors during transformation', () => {
      // Create a scenario that might throw a non-Error object
      const originalReplace = String.prototype.replace;
      String.prototype.replace = function() {
        throw 'Non-error object';
      };

      try {
        expect(() => {
          regexService.transformWithRegex('test', 'test', 'result');
        }).toThrow('Unknown transformation error');
      } finally {
        String.prototype.replace = originalReplace;
      }
    });

    it('should handle unknown errors during extraction', () => {
      const originalMatch = String.prototype.match;
      String.prototype.match = function() {
        throw 'Non-error object';
      };

      try {
        expect(() => {
          regexService.extractMatches('test', 'test', 'g');
        }).toThrow('Unknown extraction error');
      } finally {
        String.prototype.match = originalMatch;
      }
    });
  });
});