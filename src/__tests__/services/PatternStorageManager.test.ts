import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PatternStorageManager } from '../../services/PatternStorageManager';
import { PatternCategory } from '../../types/pattern';
import type { Pattern } from '../../types/pattern';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('PatternStorageManager', () => {
  let storageManager: PatternStorageManager;
  const storageKey = 'regex-patterns';

  const mockPattern: Pattern = {
    id: 'test-pattern-1',
    keyNumber: 1,
    shortKeys: ['tp1'],
    name: 'Test Pattern',
    description: 'A test pattern',
    category: PatternCategory.CUSTOM,
    searchRegex: 'test',
    replaceRegex: 'result',
    flags: 'g',
    example: {
      input: 'test input',
      output: 'result input'
    },
    isBuiltIn: false,
    tags: ['test'],
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-01-01T00:00:00.000Z'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    storageManager = new PatternStorageManager();
    
    // Reset localStorage mock
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockImplementation(() => {});
  });

  describe('getAllPatterns', () => {
    it('should return empty array when no patterns in storage', async () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      const patterns = await storageManager.getAllPatterns();
      
      expect(patterns).toEqual([]);
      expect(localStorageMock.getItem).toHaveBeenCalledWith(storageKey);
    });

    it('should return patterns from localStorage', async () => {
      const storedPatterns = [mockPattern];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(storedPatterns));
      
      const patterns = await storageManager.getAllPatterns();
      
      expect(patterns).toEqual(storedPatterns);
      expect(localStorageMock.getItem).toHaveBeenCalledWith(storageKey);
    });

    it('should handle JSON parse errors gracefully', async () => {
      localStorageMock.getItem.mockReturnValue('invalid json');
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const patterns = await storageManager.getAllPatterns();
      
      expect(patterns).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('Error loading patterns from localStorage:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });

    it('should return empty array in non-browser environment', async () => {
      // Create a new instance that thinks it's not in a browser
      const serverStorageManager = new (class extends PatternStorageManager {
        constructor() {
          super();
          // @ts-ignore - override readonly property for testing
          this.isBrowser = false;
        }
      })();
      
      const patterns = await serverStorageManager.getAllPatterns();
      
      expect(patterns).toEqual([]);
      expect(localStorageMock.getItem).not.toHaveBeenCalled();
    });
  });

  describe('savePattern', () => {
    it('should save a new pattern to localStorage', () => {
      localStorageMock.getItem.mockReturnValue('[]');
      
      const result = storageManager.savePattern(mockPattern);
      
      expect(result).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        storageKey,
        expect.stringContaining('test-pattern-1')
      );
    });

    it('should update an existing pattern', () => {
      const existingPatterns = [mockPattern];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(existingPatterns));
      
      const updatedPattern = {
        ...mockPattern,
        name: 'Updated Test Pattern'
      };
      
      const result = storageManager.savePattern(updatedPattern);
      
      expect(result).toBe(true);
      
      const savedData = localStorageMock.setItem.mock.calls[0][1];
      const savedPatterns = JSON.parse(savedData);
      expect(savedPatterns).toHaveLength(1);
      expect(savedPatterns[0].name).toBe('Updated Test Pattern');
      expect(savedPatterns[0].updatedAt).toBeDefined();
    });

    it('should add timestamps for new patterns', () => {
      localStorageMock.getItem.mockReturnValue('[]');
      
      const patternWithoutTimestamps = {
        ...mockPattern,
        createdAt: undefined,
        updatedAt: undefined
      };
      
      const result = storageManager.savePattern(patternWithoutTimestamps);
      
      expect(result).toBe(true);
      
      const savedData = localStorageMock.setItem.mock.calls[0][1];
      const savedPatterns = JSON.parse(savedData);
      expect(savedPatterns[0].createdAt).toBeDefined();
      expect(savedPatterns[0].updatedAt).toBeDefined();
    });

    it('should handle localStorage errors', () => {
      localStorageMock.getItem.mockReturnValue('[]');
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage error');
      });
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const result = storageManager.savePattern(mockPattern);
      
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Error saving pattern to localStorage:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });

    it('should return false in non-browser environment', () => {
      const serverStorageManager = new (class extends PatternStorageManager {
        constructor() {
          super();
          // @ts-ignore - override readonly property for testing
          this.isBrowser = false;
        }
      })();
      
      const result = serverStorageManager.savePattern(mockPattern);
      
      expect(result).toBe(false);
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });
  });

  describe('deletePattern', () => {
    it('should delete a pattern from localStorage', () => {
      const existingPatterns = [mockPattern, {
        ...mockPattern,
        id: 'pattern-2',
        name: 'Pattern 2'
      }];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(existingPatterns));
      
      const result = storageManager.deletePattern('test-pattern-1');
      
      expect(result).toBe(true);
      
      const savedData = localStorageMock.setItem.mock.calls[0][1];
      const savedPatterns = JSON.parse(savedData);
      expect(savedPatterns).toHaveLength(1);
      expect(savedPatterns[0].id).toBe('pattern-2');
    });

    it('should return false if pattern not found', () => {
      localStorageMock.getItem.mockReturnValue('[]');
      
      const result = storageManager.deletePattern('non-existent');
      
      expect(result).toBe(false);
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });

    it('should handle localStorage errors', () => {
      localStorageMock.getItem.mockReturnValue('[{"id":"test-pattern-1"}]');
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage error');
      });
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const result = storageManager.deletePattern('test-pattern-1');
      
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Error deleting pattern from localStorage:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });

    it('should return false in non-browser environment', () => {
      const serverStorageManager = new (class extends PatternStorageManager {
        constructor() {
          super();
          // @ts-ignore - override readonly property for testing
          this.isBrowser = false;
        }
      })();
      
      const result = serverStorageManager.deletePattern('test-pattern-1');
      
      expect(result).toBe(false);
      expect(localStorageMock.getItem).not.toHaveBeenCalled();
    });
  });

  describe('importPatterns', () => {
    it('should import valid patterns successfully', async () => {
      localStorageMock.getItem.mockReturnValue('[]');
      
      const importData = [mockPattern];
      
      const result = await storageManager.importPatterns(JSON.stringify(importData));
      
      expect(result.success).toBe(true);
      expect(result.imported).toBe(1);
      expect(result.skipped).toBe(0);
      expect(result.errors).toEqual([]);
    });

    it('should handle invalid JSON', async () => {
      const result = await storageManager.importPatterns('invalid json');
      
      expect(result.success).toBe(false);
      expect(result.imported).toBe(0);
      expect(result.errors).toEqual(['Invalid JSON format']);
    });

    it('should handle non-array data', async () => {
      const result = await storageManager.importPatterns('{"not": "an array"}');
      
      expect(result.success).toBe(false);
      expect(result.imported).toBe(0);
      expect(result.errors).toEqual(['Imported data is not an array']);
    });

    it('should skip invalid patterns', async () => {
      localStorageMock.getItem.mockReturnValue('[]');
      
      const importData = [
        mockPattern, // Valid pattern
        { // Invalid pattern - missing required fields
          id: 'invalid-pattern',
          name: 'Invalid Pattern'
          // Missing other required fields
        }
      ];
      
      const result = await storageManager.importPatterns(JSON.stringify(importData));
      
      expect(result.success).toBe(true);
      expect(result.imported).toBe(1);
      expect(result.skipped).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Invalid pattern');
    });

    it('should update existing patterns on duplicate IDs', async () => {
      const existingPattern = { ...mockPattern };
      localStorageMock.getItem.mockReturnValue(JSON.stringify([existingPattern]));
      
      const updatedPattern = {
        ...mockPattern,
        name: 'Updated Pattern'
      };
      
      const result = await storageManager.importPatterns(JSON.stringify([updatedPattern]));
      
      expect(result.success).toBe(true);
      expect(result.imported).toBe(1);
    });

    it('should ensure imported patterns are not marked as built-in', async () => {
      localStorageMock.getItem.mockReturnValue('[]');
      
      const builtInPattern = {
        ...mockPattern,
        isBuiltIn: true
      };
      
      await storageManager.importPatterns(JSON.stringify([builtInPattern]));
      
      // Check that the saved pattern has isBuiltIn set to false
      const savedData = localStorageMock.setItem.mock.calls[0][1];
      const savedPatterns = JSON.parse(savedData);
      expect(savedPatterns[0].isBuiltIn).toBe(false);
    });

    it('should return error result in non-browser environment', async () => {
      const serverStorageManager = new (class extends PatternStorageManager {
        constructor() {
          super();
          // @ts-ignore - override readonly property for testing
          this.isBrowser = false;
        }
      })();
      
      const result = await serverStorageManager.importPatterns('[]');
      
      expect(result.success).toBe(false);
      expect(result.errors).toEqual(['Cannot import patterns in server environment']);
    });

    it('should handle unexpected errors during import', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Create a malformed JSON that will fail parsing in an unexpected way
      const result = await storageManager.importPatterns('{"patterns":broken}');
      
      expect(result.success).toBe(false);
      expect(result.errors).toEqual(['Invalid JSON format']);
      
      consoleSpy.mockRestore();
    });
  });

  describe('exportPatterns', () => {
    it('should export patterns as JSON string', () => {
      const patterns = [mockPattern];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(patterns));
      
      const result = storageManager.exportPatterns();
      
      const exportedPatterns = JSON.parse(result);
      expect(exportedPatterns).toEqual(patterns);
    });

    it('should return empty array JSON for no patterns', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      const result = storageManager.exportPatterns();
      
      expect(result).toBe('[]');
    });

    it('should handle localStorage errors', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const result = storageManager.exportPatterns();
      
      expect(result).toBe('[]');
      expect(consoleSpy).toHaveBeenCalledWith('Error getting patterns from localStorage:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });

    it('should return empty array in non-browser environment', () => {
      const serverStorageManager = new (class extends PatternStorageManager {
        constructor() {
          super();
          // @ts-ignore - override readonly property for testing
          this.isBrowser = false;
        }
      })();
      
      const result = serverStorageManager.exportPatterns();
      
      expect(result).toBe('[]');
      expect(localStorageMock.getItem).not.toHaveBeenCalled();
    });
  });

  describe('pattern validation', () => {
    it('should validate patterns with all required fields', () => {
      const validPattern = {
        id: 'valid-pattern',
        name: 'Valid Pattern',
        description: 'A valid pattern',
        searchRegex: 'test',
        replaceRegex: 'result',
        example: {
          input: 'test input',
          output: 'result input'
        }
      };
      
      // Access private method for testing
      // @ts-ignore
      const isValid = storageManager.isValidPattern(validPattern);
      
      expect(isValid).toBe(true);
    });

    it('should reject patterns with missing required fields', () => {
      const invalidPatterns = [
        null,
        {},
        { id: 'test' },
        { id: 'test', name: 'Test' },
        { id: 'test', name: 'Test', description: 'Test pattern' },
        { id: 'test', name: 'Test', description: 'Test pattern', searchRegex: 'test' },
        { 
          id: 'test', 
          name: 'Test', 
          description: 'Test pattern', 
          searchRegex: 'test',
          replaceRegex: 'result'
          // Missing example
        },
        { 
          id: 'test', 
          name: 'Test', 
          description: 'Test pattern', 
          searchRegex: 'test',
          replaceRegex: 'result',
          example: {} // Missing input/output
        }
      ];
      
      invalidPatterns.forEach((pattern, index) => {
        // @ts-ignore
        const isValid = storageManager.isValidPattern(pattern);
        expect(isValid, `Pattern at index ${index} should be invalid: ${JSON.stringify(pattern)}`).toBeFalsy();
      });
    });

    it('should reject patterns with wrong field types', () => {
      const invalidPatterns = [
        {
          id: 123, // Should be string
          name: 'Test',
          description: 'Test pattern',
          searchRegex: 'test',
          replaceRegex: 'result',
          example: { input: 'test', output: 'result' }
        },
        {
          id: 'test',
          name: 123, // Should be string
          description: 'Test pattern',
          searchRegex: 'test',
          replaceRegex: 'result',
          example: { input: 'test', output: 'result' }
        },
        {
          id: 'test',
          name: 'Test',
          description: 'Test pattern',
          searchRegex: 'test',
          replaceRegex: 'result',
          example: { 
            input: 123, // Should be string
            output: 'result' 
          }
        }
      ];
      
      invalidPatterns.forEach(pattern => {
        // @ts-ignore
        const isValid = storageManager.isValidPattern(pattern);
        expect(isValid).toBe(false);
      });
    });
  });
});