import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PatternService } from '../../services/PatternService';
import { PatternStorageManager } from '../../services/PatternStorageManager';
import { PatternCategory } from '../../types/pattern';
import type { Pattern, PatternInput } from '../../types/pattern';

// Mock the storage manager
vi.mock('../../services/PatternStorageManager');
vi.mock('../../data/built-in-patterns.json', () => {
  return {
    default: [
      {
        id: 'test-pattern-1',
        keyNumber: 1,
        shortKeys: ['tp1'],
        name: 'Test Pattern 1',
        description: 'A test pattern',
        category: 'Format Conversion',
        searchRegex: 'test',
        replaceRegex: 'result',
        flags: 'g',
        example: {
          input: 'test input',
          output: 'result input'
        },
        isBuiltIn: true,
        tags: ['test'],
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      }
    ]
  };
});

describe('PatternService', () => {
  let patternService: PatternService;
  let mockPatternStorageManager: PatternStorageManager;

  beforeEach(() => {
    vi.clearAllMocks();
    patternService = new PatternService();
    // @ts-ignore - accessing private property for testing
    mockPatternStorageManager = patternService.patternStorageManager;
    
    // Setup default mocks
    vi.mocked(mockPatternStorageManager.getAllPatterns).mockResolvedValue([]);
    vi.mocked(mockPatternStorageManager.savePattern).mockReturnValue(true);
    vi.mocked(mockPatternStorageManager.deletePattern).mockReturnValue(true);
  });

  describe('initialization', () => {
    it('should initialize with built-in patterns', async () => {
      await patternService.initialize();
      const patterns = await patternService.getAllPatterns();
      
      expect(patterns).toHaveLength(1);
      expect(patterns[0].id).toBe('test-pattern-1');
      expect(patterns[0].isBuiltIn).toBe(true);
    });

    it('should combine built-in and user patterns', async () => {
      const userPattern: Pattern = {
        id: 'user-pattern-1',
        keyNumber: 2,
        shortKeys: [],
        name: 'User Pattern',
        description: 'A user-created pattern',
        category: PatternCategory.CUSTOM,
        searchRegex: 'user',
        replaceRegex: 'custom',
        flags: 'g',
        example: {
          input: 'user input',
          output: 'custom input'
        },
        isBuiltIn: false,
        tags: [],
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      };

      vi.mocked(mockPatternStorageManager.getAllPatterns).mockResolvedValue([userPattern]);

      await patternService.initialize();
      const patterns = await patternService.getAllPatterns();
      
      expect(patterns).toHaveLength(2);
      expect(patterns.find(p => p.isBuiltIn)).toBeDefined();
      expect(patterns.find(p => !p.isBuiltIn)).toBeDefined();
    });

    it('should not initialize multiple times', async () => {
      await patternService.initialize();
      await patternService.initialize();
      
      expect(mockPatternStorageManager.getAllPatterns).toHaveBeenCalledTimes(1);
    });
  });

  describe('pattern retrieval', () => {
    beforeEach(async () => {
      await patternService.initialize();
    });

    it('should get pattern by ID', async () => {
      const pattern = await patternService.getPatternById('test-pattern-1');
      
      expect(pattern).toBeDefined();
      expect(pattern?.id).toBe('test-pattern-1');
    });

    it('should return undefined for non-existent pattern', async () => {
      const pattern = await patternService.getPatternById('non-existent');
      
      expect(pattern).toBeUndefined();
    });

    it('should get patterns by category', async () => {
      const patterns = await patternService.getPatternsByCategory(PatternCategory.FORMAT_CONVERSION);
      
      expect(patterns).toHaveLength(1);
      expect(patterns[0].category).toBe(PatternCategory.FORMAT_CONVERSION);
    });
  });

  describe('pattern creation', () => {
    beforeEach(async () => {
      await patternService.initialize();
    });

    it('should create a new pattern successfully', async () => {
      const patternInput: PatternInput = {
        name: 'New Pattern',
        description: 'A new test pattern',
        category: PatternCategory.CUSTOM,
        searchRegex: 'new',
        replaceRegex: 'created',
        flags: 'g',
        example: {
          input: 'new test',
          output: 'created test'
        },
        tags: ['new', 'test']
      };

      const createdPattern = await patternService.createPattern(patternInput);
      
      expect(createdPattern.id).toBeDefined();
      expect(createdPattern.keyNumber).toBe(2); // Next available key number
      expect(createdPattern.name).toBe(patternInput.name);
      expect(createdPattern.isBuiltIn).toBe(false);
      expect(createdPattern.createdAt).toBeDefined();
      expect(createdPattern.updatedAt).toBeDefined();
      expect(mockPatternStorageManager.savePattern).toHaveBeenCalledWith(createdPattern);
    });

    it('should generate unique pattern IDs', async () => {
      const patternInput: PatternInput = {
        name: 'Test Pattern Name',
        description: 'A test pattern',
        category: PatternCategory.CUSTOM,
        searchRegex: 'test',
        replaceRegex: 'result',
        example: {
          input: 'test',
          output: 'result'
        }
      };

      const pattern1 = await patternService.createPattern(patternInput);
      // Wait a small amount to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 1));
      const pattern2 = await patternService.createPattern(patternInput);
      
      expect(pattern1.id).not.toBe(pattern2.id);
      expect(pattern1.id).toMatch(/^test-pattern-name-[a-z0-9]+$/);
    });

    it('should validate pattern before creation', async () => {
      const invalidPattern: PatternInput = {
        name: '',
        description: 'Invalid pattern',
        category: PatternCategory.CUSTOM,
        searchRegex: '(',
        replaceRegex: 'result',
        example: {
          input: 'test',
          output: 'result'
        }
      };

      await expect(patternService.createPattern(invalidPattern)).rejects.toThrow();
    });

    it('should handle storage failure', async () => {
      vi.mocked(mockPatternStorageManager.savePattern).mockReturnValue(false);

      const patternInput: PatternInput = {
        name: 'Test Pattern',
        description: 'A test pattern',
        category: PatternCategory.CUSTOM,
        searchRegex: 'test',
        replaceRegex: 'result',
        example: {
          input: 'test',
          output: 'result'
        }
      };

      await expect(patternService.createPattern(patternInput)).rejects.toThrow('Failed to save pattern');
    });
  });

  describe('pattern updates', () => {
    beforeEach(async () => {
      await patternService.initialize();
    });

    it('should update a user pattern successfully', async () => {
      // First create a user pattern
      const userPattern: Pattern = {
        id: 'user-pattern-1',
        keyNumber: 2,
        shortKeys: [],
        name: 'User Pattern',
        description: 'Original description',
        category: PatternCategory.CUSTOM,
        searchRegex: 'original',
        replaceRegex: 'original_result',
        flags: 'g',
        example: {
          input: 'original test',
          output: 'original_result test'
        },
        isBuiltIn: false,
        tags: [],
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      };

      // Add the pattern to the service's internal state
      // @ts-ignore - accessing private property for testing
      patternService.patterns.push(userPattern);

      const updates = {
        description: 'Updated description',
        searchRegex: 'updated',
        replaceRegex: 'updated_result'
      };

      const updatedPattern = await patternService.updatePattern('user-pattern-1', updates);
      
      expect(updatedPattern.description).toBe('Updated description');
      expect(updatedPattern.searchRegex).toBe('updated');
      expect(updatedPattern.replaceRegex).toBe('updated_result');
      expect(updatedPattern.updatedAt).not.toBe(userPattern.updatedAt);
      expect(mockPatternStorageManager.savePattern).toHaveBeenCalledWith(updatedPattern);
    });

    it('should not allow updating built-in patterns', async () => {
      await expect(
        patternService.updatePattern('test-pattern-1', { description: 'Updated' })
      ).rejects.toThrow('Cannot update built-in patterns');
    });

    it('should throw error for non-existent pattern', async () => {
      await expect(
        patternService.updatePattern('non-existent', { description: 'Updated' })
      ).rejects.toThrow('Pattern not found');
    });
  });

  describe('pattern deletion', () => {
    beforeEach(async () => {
      await patternService.initialize();
    });

    it('should delete a user pattern successfully', async () => {
      const userPattern: Pattern = {
        id: 'user-pattern-1',
        keyNumber: 2,
        shortKeys: [],
        name: 'User Pattern',
        description: 'A user pattern',
        category: PatternCategory.CUSTOM,
        searchRegex: 'user',
        replaceRegex: 'result',
        flags: 'g',
        example: {
          input: 'user test',
          output: 'result test'
        },
        isBuiltIn: false,
        tags: [],
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      };

      // @ts-ignore - accessing private property for testing
      patternService.patterns.push(userPattern);

      const result = await patternService.deletePattern('user-pattern-1');
      
      expect(result).toBe(true);
      expect(mockPatternStorageManager.deletePattern).toHaveBeenCalledWith('user-pattern-1');
      
      const patterns = await patternService.getAllPatterns();
      expect(patterns.find(p => p.id === 'user-pattern-1')).toBeUndefined();
    });

    it('should not allow deleting built-in patterns', async () => {
      await expect(
        patternService.deletePattern('test-pattern-1')
      ).rejects.toThrow('Cannot delete built-in patterns');
    });

    it('should return false for non-existent pattern', async () => {
      const result = await patternService.deletePattern('non-existent');
      
      expect(result).toBe(false);
    });
  });

  describe('pattern search', () => {
    beforeEach(async () => {
      await patternService.initialize();
    });

    it('should return all patterns for empty query', async () => {
      const result = await patternService.searchPatterns('');
      
      expect(result.patterns).toHaveLength(1);
      expect(result.query).toBe('');
    });

    it('should search by key number', async () => {
      const result = await patternService.searchPatterns('1');
      
      expect(result.patterns).toHaveLength(1);
      expect(result.patterns[0].keyNumber).toBe(1);
    });

    it('should search by short key', async () => {
      const result = await patternService.searchPatterns('tp1');
      
      expect(result.patterns).toHaveLength(1);
      expect(result.patterns[0].shortKeys).toContain('tp1');
    });

    it('should search by name', async () => {
      const result = await patternService.searchPatterns('Test Pattern');
      
      expect(result.patterns).toHaveLength(1);
      expect(result.patterns[0].name).toContain('Test Pattern');
    });

    it('should search by description', async () => {
      const result = await patternService.searchPatterns('test pattern');
      
      expect(result.patterns).toHaveLength(1);
      expect(result.patterns[0].description).toContain('test pattern');
    });

    it('should search by tags', async () => {
      const result = await patternService.searchPatterns('test');
      
      expect(result.patterns).toHaveLength(1);
      expect(result.patterns[0].tags).toContain('test');
    });

    it('should prioritize exact key number matches', async () => {
      // Add another pattern with keyNumber 11 (which contains '1')
      const anotherPattern: Pattern = {
        id: 'pattern-11',
        keyNumber: 11,
        shortKeys: [],
        name: 'Pattern 11',
        description: 'Another pattern',
        category: PatternCategory.CUSTOM,
        searchRegex: 'test',
        replaceRegex: 'result',
        flags: 'g',
        example: {
          input: 'test',
          output: 'result'
        },
        isBuiltIn: false,
        tags: [],
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      };

      // @ts-ignore - accessing private property for testing
      patternService.patterns.push(anotherPattern);

      const result = await patternService.searchPatterns('1');
      
      expect(result.patterns).toHaveLength(1);
      expect(result.patterns[0].keyNumber).toBe(1); // Exact match, not 11
    });
  });

  describe('pattern validation', () => {
    beforeEach(async () => {
      await patternService.initialize();
    });

    it('should validate pattern with all required fields', async () => {
      const validPattern: PatternInput = {
        name: 'Valid Pattern',
        description: 'A valid pattern',
        category: PatternCategory.CUSTOM,
        searchRegex: 'valid',
        replaceRegex: 'result',
        example: {
          input: 'valid test',
          output: 'result test'
        }
      };

      // This should not throw
      const pattern = await patternService.createPattern(validPattern);
      expect(pattern).toBeDefined();
    });

    it('should reject pattern with empty name', async () => {
      const invalidPattern: PatternInput = {
        name: '',
        description: 'A pattern with empty name',
        category: PatternCategory.CUSTOM,
        searchRegex: 'test',
        replaceRegex: 'result',
        example: {
          input: 'test',
          output: 'result'
        }
      };

      await expect(patternService.createPattern(invalidPattern)).rejects.toThrow('Pattern name is required');
    });

    it('should reject pattern with empty description', async () => {
      const invalidPattern: PatternInput = {
        name: 'Test Pattern',
        description: '',
        category: PatternCategory.CUSTOM,
        searchRegex: 'test',
        replaceRegex: 'result',
        example: {
          input: 'test',
          output: 'result'
        }
      };

      await expect(patternService.createPattern(invalidPattern)).rejects.toThrow('Pattern description is required');
    });

    it('should reject pattern with invalid regex', async () => {
      const invalidPattern: PatternInput = {
        name: 'Test Pattern',
        description: 'A pattern with invalid regex',
        category: PatternCategory.CUSTOM,
        searchRegex: '(',
        replaceRegex: 'result',
        example: {
          input: 'test',
          output: 'result'
        }
      };

      await expect(patternService.createPattern(invalidPattern)).rejects.toThrow('Invalid search regex');
    });

    it('should validate short keys', async () => {
      const invalidPattern: PatternInput = {
        name: 'Test Pattern',
        description: 'A pattern with invalid short keys',
        category: PatternCategory.CUSTOM,
        searchRegex: 'test',
        replaceRegex: 'result',
        shortKeys: ['toolong', 'inv@lid'],
        example: {
          input: 'test',
          output: 'result'
        }
      };

      await expect(patternService.createPattern(invalidPattern)).rejects.toThrow();
    });
  });

  describe('import/export', () => {
    beforeEach(async () => {
      await patternService.initialize();
    });

    it('should export user patterns to JSON', async () => {
      const userPattern: Pattern = {
        id: 'user-pattern-1',
        keyNumber: 2,
        shortKeys: [],
        name: 'User Pattern',
        description: 'A user pattern',
        category: PatternCategory.CUSTOM,
        searchRegex: 'user',
        replaceRegex: 'result',
        flags: 'g',
        example: {
          input: 'user test',
          output: 'result test'
        },
        isBuiltIn: false,
        tags: [],
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      };

      // @ts-ignore - accessing private property for testing
      patternService.patterns.push(userPattern);

      const exportedJson = await patternService.exportPatterns();
      const exportedPatterns = JSON.parse(exportedJson);
      
      expect(exportedPatterns).toHaveLength(1);
      expect(exportedPatterns[0].id).toBe('user-pattern-1');
      expect(exportedPatterns[0].isBuiltIn).toBe(false);
    });

    it('should import patterns successfully', async () => {
      const importPatterns = [
        {
          id: 'imported-pattern-1',
          keyNumber: 10,
          shortKeys: [],
          name: 'Imported Pattern',
          description: 'An imported pattern',
          category: PatternCategory.CUSTOM,
          searchRegex: 'imported',
          replaceRegex: 'result',
          flags: 'g',
          example: {
            input: 'imported test',
            output: 'result test'
          },
          isBuiltIn: false,
          tags: [],
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z'
        }
      ];

      vi.mocked(mockPatternStorageManager.importPatterns).mockResolvedValue({
        success: true,
        imported: 1,
        skipped: 0
      });
      vi.mocked(mockPatternStorageManager.getAllPatterns).mockResolvedValue(importPatterns);

      const result = await patternService.importPatterns(JSON.stringify(importPatterns));
      
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('imported-pattern-1');
      expect(mockPatternStorageManager.importPatterns).toHaveBeenCalledWith(JSON.stringify(importPatterns));
    });

    it('should handle import failures', async () => {
      vi.mocked(mockPatternStorageManager.importPatterns).mockResolvedValue({
        success: false,
        imported: 0,
        skipped: 1,
        errors: ['Invalid pattern format']
      });

      await expect(
        patternService.importPatterns('invalid json')
      ).rejects.toThrow('Import failed: Invalid pattern format');
    });
  });
});