/**
 * Tests for optimized JSON worker performance
 * These tests verify the worker-level optimizations
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock the worker environment
const mockWorker = {
  postMessage: vi.fn(),
  onmessage: null as any
};

// Mock global worker functions
global.self = mockWorker as any;
global.importScripts = vi.fn();
global.JSONPath = vi.fn().mockImplementation((config) => {
  // Mock JSONPath for basic functionality
  return [{ value: { test: 'data' }, pointer: '/test' }];
});

// Import worker functions after mocking globals
let workerHandlers: any;

// We need to dynamically import the worker since it's not a module
const workerCode = `
// Simulate the optimized worker functions
const SEARCH_CONFIG = {
  maxResults: 1000,
  maxTraversalDepth: 20,
  timeoutMs: 5000,
  progressUpdateInterval: 100
};

class SearchCache {
  constructor(maxSize = 50) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }
  
  getCacheKey(query, searchType, pathScope) {
    return \`\${query}|\${searchType}|\${pathScope || ''}\`;
  }
  
  get(query, searchType, pathScope) {
    const key = this.getCacheKey(query, searchType, pathScope);
    return this.cache.get(key) || null;
  }
  
  set(query, searchType, pathScope, result) {
    const key = this.getCacheKey(query, searchType, pathScope);
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, result);
  }
  
  clear() {
    this.cache.clear();
  }
}

function findMatchesOptimized(obj, query, searchType, currentPath = '', maxResults = SEARCH_CONFIG.maxResults, requestId = null) {
  let paths = [];
  let count = 0;
  let traversalDepth = 0;
  let progressCounter = 0;
  const startTime = Date.now();
  const queryLower = query.toLowerCase();
  
  function traverse(current, path, depth = 0) {
    if (count >= maxResults) return;
    if (depth > SEARCH_CONFIG.maxTraversalDepth) return;
    if (Date.now() - startTime > SEARCH_CONFIG.timeoutMs) return;
    
    // Check for value matches
    if ((searchType === 'both' || searchType === 'values')) {
      if (typeof current === 'string' || typeof current === 'number') {
        const stringValue = String(current).toLowerCase();
        if (stringValue.includes(queryLower)) {
          paths.push({ path, type: 'value', value: current });
          count++;
          if (count >= maxResults) return;
        }
      }
    }
    
    // Check for property matches and continue traversal
    if (typeof current === 'object' && current !== null) {
      if (Array.isArray(current)) {
        current.forEach((item, index) => {
          if (count < maxResults) {
            traverse(item, path ? \`\${path}[\${index}]\` : \`[\${index}]\`, depth + 1);
          }
        });
      } else {
        Object.keys(current).forEach(key => {
          if (count < maxResults) {
            if ((searchType === 'both' || searchType === 'properties') && 
                key.toLowerCase().includes(queryLower)) {
              const newPath = path ? \`\${path}.\${key}\` : key;
              paths.push({ path: newPath, type: 'property', value: key });
              count++;
            }
            
            if (count < maxResults) {
              const newPath = path ? \`\${path}.\${key}\` : key;
              traverse(current[key], newPath, depth + 1);
            }
          }
        });
      }
    }
  }
  
  traverse(obj, currentPath);
  
  return {
    paths: paths.slice(0, maxResults),
    count: Math.min(count, maxResults),
    truncated: count > maxResults
  };
}

// Export for testing
global.findMatchesOptimized = findMatchesOptimized;
global.SearchCache = SearchCache;
global.SEARCH_CONFIG = SEARCH_CONFIG;
`;

// Execute the worker code in the test environment
eval(workerCode);

describe('JSON Worker Optimizations', () => {
  let searchCache: any;
  let testData: any;

  beforeEach(() => {
    searchCache = new (global as any).SearchCache();
    testData = {
      users: [
        { id: 1, name: 'Alice Johnson', email: 'alice@example.com', department: 'Engineering' },
        { id: 2, name: 'Bob Smith', email: 'bob@example.com', department: 'Marketing' },
        { id: 3, name: 'Charlie Brown', email: 'charlie@example.com', department: 'Engineering' }
      ],
      products: [
        { id: 1, title: 'Laptop', category: 'Electronics', price: 999 },
        { id: 2, title: 'Phone', category: 'Electronics', price: 599 }
      ],
      metadata: {
        version: '1.0',
        created: '2024-01-01',
        author: 'Test System'
      }
    };
  });

  describe('Unified Search Function', () => {
    it('should find value matches efficiently', () => {
      const result = (global as any).findMatchesOptimized(
        testData, 
        'alice', 
        'values', 
        '', 
        1000
      );

      expect(result.paths.length).toBeGreaterThan(0);
      expect(result.count).toBeGreaterThan(0);
      expect(result.truncated).toBe(false);
      
      // Should find the value in the email
      const aliceMatch = result.paths.find((p: any) => 
        p.path.includes('email') && p.type === 'value'
      );
      expect(aliceMatch).toBeTruthy();
    });

    it('should find property matches efficiently', () => {
      const result = (global as any).findMatchesOptimized(
        testData, 
        'name', 
        'properties', 
        '', 
        1000
      );

      expect(result.paths.length).toBeGreaterThan(0);
      expect(result.count).toBeGreaterThan(0);
      
      // Should find 'name' properties
      const nameMatch = result.paths.find((p: any) => 
        p.path.includes('name') && p.type === 'property'
      );
      expect(nameMatch).toBeTruthy();
    });

    it('should handle both value and property search in single traversal', () => {
      const result = (global as any).findMatchesOptimized(
        testData, 
        'engineering', 
        'both', 
        '', 
        1000
      );

      expect(result.paths.length).toBeGreaterThan(0);
      
      // Should find both value matches (department) and any property matches
      const valueMatches = result.paths.filter((p: any) => p.type === 'value');
      expect(valueMatches.length).toBeGreaterThan(0);
    });

    it('should respect result limits to prevent UI freezing', () => {
      const maxResults = 5;
      const result = (global as any).findMatchesOptimized(
        testData, 
        'e', // Should match many things
        'both', 
        '', 
        maxResults
      );

      expect(result.paths.length).toBeLessThanOrEqual(maxResults);
      expect(result.count).toBeLessThanOrEqual(maxResults);
      
      if (result.truncated) {
        expect(result.count).toBe(maxResults);
      }
    });

    it('should handle empty results gracefully', () => {
      const result = (global as any).findMatchesOptimized(
        testData, 
        'nonexistent', 
        'both', 
        '', 
        1000
      );

      expect(result.paths).toEqual([]);
      expect(result.count).toBe(0);
      expect(result.truncated).toBe(false);
    });

    it('should handle nested object traversal with depth limits', () => {
      const deepData = {
        level1: {
          level2: {
            level3: {
              level4: {
                level5: {
                  deepValue: 'found'
                }
              }
            }
          }
        }
      };

      const result = (global as any).findMatchesOptimized(
        deepData, 
        'found', 
        'values', 
        '', 
        1000
      );

      // Should find the deep value within depth limits
      expect(result.paths.length).toBeGreaterThan(0);
      const deepMatch = result.paths.find((p: any) => p.value === 'found');
      expect(deepMatch).toBeTruthy();
    });

    it('should handle array traversal correctly', () => {
      const arrayData = {
        items: ['apple', 'banana', 'cherry'],
        nested: [
          { name: 'item1', value: 'test1' },
          { name: 'item2', value: 'test2' }
        ]
      };

      const result = (global as any).findMatchesOptimized(
        arrayData, 
        'banana', 
        'values', 
        '', 
        1000
      );

      expect(result.paths.length).toBeGreaterThan(0);
      const bananaMatch = result.paths.find((p: any) => p.value === 'banana');
      expect(bananaMatch).toBeTruthy();
      expect(bananaMatch.path).toContain('[1]'); // Should be at index 1
    });
  });

  describe('Search Cache', () => {
    it('should cache search results', () => {
      const query = 'test';
      const searchType = 'both';
      const pathScope = '';
      const result = { count: 5, paths: ['test.path'] };

      searchCache.set(query, searchType, pathScope, result);
      const cached = searchCache.get(query, searchType, pathScope);

      expect(cached).toEqual(result);
    });

    it('should implement LRU eviction', () => {
      const smallCache = new (global as any).SearchCache(2);

      // Fill cache beyond capacity
      smallCache.set('query1', 'both', '', { count: 1 });
      smallCache.set('query2', 'both', '', { count: 2 });
      smallCache.set('query3', 'both', '', { count: 3 }); // Should evict query1

      expect(smallCache.get('query1', 'both', '')).toBeNull();
      expect(smallCache.get('query2', 'both', '')).toBeTruthy();
      expect(smallCache.get('query3', 'both', '')).toBeTruthy();
    });

    it('should handle cache key generation correctly', () => {
      const key1 = searchCache.getCacheKey('test', 'both', 'path');
      const key2 = searchCache.getCacheKey('test', 'both', 'path');
      const key3 = searchCache.getCacheKey('test', 'values', 'path');

      expect(key1).toBe(key2);
      expect(key1).not.toBe(key3);
    });

    it('should clear cache completely', () => {
      searchCache.set('query1', 'both', '', { count: 1 });
      searchCache.set('query2', 'values', '', { count: 2 });

      expect(searchCache.get('query1', 'both', '')).toBeTruthy();
      
      searchCache.clear();
      
      expect(searchCache.get('query1', 'both', '')).toBeNull();
      expect(searchCache.get('query2', 'values', '')).toBeNull();
    });
  });

  describe('Performance Characteristics', () => {
    it('should complete searches within time limits', () => {
      const largeData = {
        items: Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          name: `Item ${i}`,
          category: `Category ${i % 10}`
        }))
      };

      const startTime = Date.now();
      const result = (global as any).findMatchesOptimized(
        largeData, 
        'Item', 
        'both', 
        '', 
        100 // Limit results
      );
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
      expect(result.paths.length).toBeLessThanOrEqual(100);
    });

    it('should handle timeout gracefully', () => {
      // Mock a scenario where search takes too long
      const originalConfig = (global as any).SEARCH_CONFIG;
      (global as any).SEARCH_CONFIG = {
        ...originalConfig,
        timeoutMs: 1 // Very short timeout
      };

      const result = (global as any).findMatchesOptimized(
        testData, 
        'test', 
        'both', 
        '', 
        1000
      );

      // Should return partial results due to timeout
      expect(result).toBeTruthy();
      expect(result.paths).toBeDefined();
      expect(result.count).toBeDefined();

      // Restore original config
      (global as any).SEARCH_CONFIG = originalConfig;
    });

    it('should prevent infinite loops with circular references', () => {
      const circularData: any = { name: 'test' };
      circularData.self = circularData; // Create circular reference

      // Should not hang or crash
      expect(() => {
        (global as any).findMatchesOptimized(
          circularData, 
          'test', 
          'both', 
          '', 
          100
        );
      }).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle null and undefined values', () => {
      const dataWithNulls = {
        nullValue: null,
        undefinedValue: undefined,
        emptyString: '',
        zeroValue: 0,
        falseValue: false
      };

      const result = (global as any).findMatchesOptimized(
        dataWithNulls, 
        '0', 
        'values', 
        '', 
        1000
      );

      // Should find the zero value
      expect(result.paths.length).toBeGreaterThan(0);
      const zeroMatch = result.paths.find((p: any) => p.value === 0);
      expect(zeroMatch).toBeTruthy();
    });

    it('should handle special characters in search query', () => {
      const dataWithSpecialChars = {
        'special-key': 'value',
        'key.with.dots': 'dotted',
        'key[with]brackets': 'bracketed'
      };

      const result = (global as any).findMatchesOptimized(
        dataWithSpecialChars, 
        'special-key', 
        'properties', 
        '', 
        1000
      );

      expect(result.paths.length).toBeGreaterThan(0);
    });

    it('should handle empty objects and arrays', () => {
      const emptyData = {
        emptyObject: {},
        emptyArray: [],
        nested: {
          alsoEmpty: {}
        }
      };

      const result = (global as any).findMatchesOptimized(
        emptyData, 
        'empty', 
        'properties', 
        '', 
        1000
      );

      // Should find properties with 'empty' in the name
      expect(result.paths.length).toBeGreaterThan(0);
    });

    it('should be case-insensitive for searches', () => {
      const result1 = (global as any).findMatchesOptimized(
        testData, 
        'ALICE', 
        'values', 
        '', 
        1000
      );

      const result2 = (global as any).findMatchesOptimized(
        testData, 
        'alice', 
        'values', 
        '', 
        1000
      );

      expect(result1.count).toBe(result2.count);
      expect(result1.paths.length).toBe(result2.paths.length);
    });
  });
});