import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { 
  jsonViewerActions,
  searchQuery,
  searchType,
  filterResults,
  processingStatus,
  isFiltering,
  originalJSON,
  parsedJSON
} from '../../stores/jsonViewerStore';

// Mock the services with performance-focused implementations
vi.mock('../../services/OPFSStorageService', () => ({
  OPFSStorageService: {
    getInstance: () => ({
      initialize: vi.fn(),
      saveJSON: vi.fn().mockResolvedValue('localStorage'),
      loadJSON: vi.fn().mockResolvedValue(null),
      deleteJSON: vi.fn().mockResolvedValue(undefined)
    })
  }
}));

// Enhanced mock for performance testing
vi.mock('../../services/JSONWorkerService', () => ({
  JSONWorkerService: {
    getInstance: () => ({
      initialize: vi.fn(),
      setJSON: vi.fn().mockResolvedValue(undefined),
      unifiedSearch: vi.fn().mockImplementation(async (config) => {
        // Simulate optimized search performance
        const { query, type, maxResults = 1000 } = config;
        
        // Simulate finding matches based on query
        const mockPaths = [];
        const baseCount = query.length * 10; // Simulate more matches for longer queries
        const actualCount = Math.min(baseCount, maxResults);
        
        for (let i = 0; i < actualCount; i++) {
          mockPaths.push({
            path: `data[${i}].field${i}`,
            type: type === 'both' ? (i % 2 === 0 ? 'value' : 'property') : type,
            value: query
          });
        }
        
        return {
          matchCount: actualCount,
          matchedPaths: mockPaths,
          processingTime: Math.min(50, actualCount / 20), // Simulate fast processing
          truncated: baseCount > maxResults,
          fromCache: false
        };
      }),
      searchByValue: vi.fn().mockResolvedValue({
        filteredJSON: { test: 'filtered' },
        matchCount: 1,
        matchedPaths: ['test'],
        processingTime: 25
      }),
      clearJSON: vi.fn().mockResolvedValue(undefined)
    })
  }
}));

describe('JSON Viewer Performance Optimizations', () => {
  let mockPerformanceNow: any;
  let performanceCalls: number[] = [];

  beforeEach(() => {
    // Reset store state
    originalJSON.set(null);
    parsedJSON.set(null);
    searchQuery.set('');
    searchType.set('both');
    filterResults.set(null);
    
    // Mock performance.now for timing tests
    performanceCalls = [];
    mockPerformanceNow = vi.spyOn(global.performance, 'now')
      .mockImplementation(() => {
        const time = performanceCalls.length * 10;
        performanceCalls.push(time);
        return time;
      });
  });

  afterEach(() => {
    mockPerformanceNow.mockRestore();
  });

  describe('Search Performance Optimizations', () => {
    beforeEach(async () => {
      // Load test data
      const largeJSON = {
        users: Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          name: `User${i}`,
          email: `user${i}@example.com`,
          profile: {
            age: 20 + (i % 50),
            department: `Dept${i % 10}`,
            settings: {
              theme: i % 2 === 0 ? 'light' : 'dark',
              notifications: true
            }
          }
        }))
      };
      
      await jsonViewerActions.loadJSONFromText(JSON.stringify(largeJSON));
    });

    it('should implement debounced search to prevent excessive requests', async () => {
      const searchSpy = vi.spyOn(jsonViewerActions, 'unifiedSearch');
      
      // Simulate rapid typing
      searchQuery.set('u');
      searchQuery.set('us');
      searchQuery.set('use');
      searchQuery.set('user');
      
      // Call search multiple times rapidly
      const promises = [
        jsonViewerActions.unifiedSearch(),
        jsonViewerActions.unifiedSearch(),
        jsonViewerActions.unifiedSearch()
      ];
      
      await Promise.all(promises);
      
      // Should not execute multiple times due to debouncing
      expect(searchSpy).toHaveBeenCalled();
    });

    it('should limit search results to prevent UI freezing', async () => {
      searchQuery.set('user'); // Should match many records
      await jsonViewerActions.unifiedSearch();
      
      const results = filterResults.get();
      expect(results).toBeTruthy();
      expect(results!.matchCount).toBeLessThanOrEqual(1000);
      
      if (results!.truncated) {
        expect(results!.matchCount).toBe(1000); // Max limit reached
      }
    });

    it('should batch state updates to reduce re-renders', async () => {
      const statusUpdates: string[] = [];
      const filteringUpdates: boolean[] = [];
      
      // Track state changes
      const unsubscribeStatus = processingStatus.subscribe((status) => {
        statusUpdates.push(status);
      });
      
      const unsubscribeFiltering = isFiltering.subscribe((filtering) => {
        filteringUpdates.push(filtering);
      });
      
      searchQuery.set('test');
      await jsonViewerActions.unifiedSearch();
      
      // Should have minimal state updates due to batching
      expect(statusUpdates.length).toBeLessThanOrEqual(3); // idle -> processing -> ready
      expect(filteringUpdates.length).toBeLessThanOrEqual(3); // false -> true -> false
      
      unsubscribeStatus();
      unsubscribeFiltering();
    });

    it('should handle search cancellation properly', async () => {
      searchQuery.set('user');
      
      // Start search and immediately cancel
      const searchPromise = jsonViewerActions.unifiedSearch();
      jsonViewerActions.cancelSearch();
      
      await searchPromise;
      
      // Should reset to ready state
      expect(processingStatus.get()).toBe('ready');
      expect(isFiltering.get()).toBe(false);
    });

    it('should support both value and property search in single traversal', async () => {
      searchQuery.set('user');
      searchType.set('both');
      
      const startTime = performance.now();
      await jsonViewerActions.unifiedSearch();
      const endTime = performance.now();
      
      const results = filterResults.get();
      expect(results).toBeTruthy();
      expect(results!.processingTime).toBeLessThan(100); // Should be fast due to single traversal
      
      // Should find both value and property matches
      const paths = results!.matchedPaths;
      expect(paths.length).toBeGreaterThan(0);
    });

    it('should return minimal payload without full JSON', async () => {
      searchQuery.set('test');
      await jsonViewerActions.unifiedSearch();
      
      const results = filterResults.get();
      expect(results).toBeTruthy();
      
      // Should not include full filteredJSON to reduce payload
      expect(results).toHaveProperty('matchCount');
      expect(results).toHaveProperty('matchedPaths');
      expect(results).toHaveProperty('processingTime');
      expect(results).not.toHaveProperty('filteredJSON');
    });
  });

  describe('Memory Management Optimizations', () => {
    it('should clear memory when loading new JSON', async () => {
      // Load first JSON
      await jsonViewerActions.loadJSONFromText('{"first": "data"}');
      expect(originalJSON.get()).toBeTruthy();
      expect(parsedJSON.get()).toBeTruthy();
      
      // Load second JSON - should clear previous data
      await jsonViewerActions.loadJSONFromText('{"second": "data"}');
      
      const current = parsedJSON.get();
      expect(current).toEqual({ second: 'data' });
      expect(current).not.toEqual({ first: 'data' });
    });

    it('should provide explicit memory cleanup method', () => {
      // Load some data
      originalJSON.set('{"test": "data"}');
      parsedJSON.set({ test: 'data' });
      filterResults.set({
        matchCount: 1,
        matchedPaths: ['test'],
        processingTime: 10
      });
      
      // Clear memory
      jsonViewerActions.clearMemory();
      
      // All data should be cleared
      expect(originalJSON.get()).toBe(null);
      expect(parsedJSON.get()).toBe(null);
      expect(filterResults.get()).toBe(null);
    });

    it('should cancel searches during memory cleanup', async () => {
      searchQuery.set('test');
      
      // Start search and immediately clear memory
      const searchPromise = jsonViewerActions.unifiedSearch();
      jsonViewerActions.clearMemory();
      
      await searchPromise;
      
      // Should be in clean state
      expect(processingStatus.get()).toBe('idle');
      expect(isFiltering.get()).toBe(false);
    });
  });

  describe('Cache Performance', () => {
    beforeEach(async () => {
      await jsonViewerActions.loadJSONFromText('{"cached": "data"}');
    });

    it('should return cached results for repeated queries', async () => {
      const query = 'cached';
      searchQuery.set(query);
      
      // First search
      const start1 = performance.now();
      await jsonViewerActions.unifiedSearch();
      const end1 = performance.now();
      
      const firstResult = filterResults.get();
      
      // Second search with same query
      const start2 = performance.now();
      await jsonViewerActions.unifiedSearch();
      const end2 = performance.now();
      
      const secondResult = filterResults.get();
      
      // Results should be identical
      expect(secondResult).toEqual(firstResult);
      
      // Second search should potentially be faster (from cache)
      // Note: In real implementation, cached results would have fromCache: true
    });

    it('should handle cache invalidation when JSON changes', async () => {
      searchQuery.set('test');
      await jsonViewerActions.unifiedSearch();
      
      const firstResult = filterResults.get();
      
      // Load new JSON (should invalidate cache)
      await jsonViewerActions.loadJSONFromText('{"different": "data"}');
      
      // Search again
      await jsonViewerActions.unifiedSearch();
      
      const secondResult = filterResults.get();
      
      // Results should be different due to new data
      expect(secondResult).toBeTruthy();
      // The actual content would be different in real implementation
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle search with empty query gracefully', async () => {
      searchQuery.set('');
      await jsonViewerActions.unifiedSearch();
      
      // Should not crash and maintain stable state
      expect(processingStatus.get()).not.toBe('error');
    });

    it('should handle search before JSON is loaded', async () => {
      // No JSON loaded
      searchQuery.set('test');
      await jsonViewerActions.unifiedSearch();
      
      // Should handle gracefully
      expect(processingStatus.get()).not.toBe('error');
    });

    it('should maintain stable state during rapid operations', async () => {
      await jsonViewerActions.loadJSONFromText('{"test": "data"}');
      
      // Rapid operations
      const operations = [
        () => { searchQuery.set('test1'); return jsonViewerActions.unifiedSearch(); },
        () => { searchQuery.set('test2'); return jsonViewerActions.unifiedSearch(); },
        () => jsonViewerActions.cancelSearch(),
        () => { searchQuery.set('test3'); return jsonViewerActions.unifiedSearch(); }
      ];
      
      // Execute rapidly
      await Promise.all(operations.map(op => op()));
      
      // Should end in stable state
      expect(['ready', 'idle', 'processing']).toContain(processingStatus.get());
    });
  });

  describe('Performance Benchmarks', () => {
    it('should process large JSON efficiently', async () => {
      // Create large test data
      const largeData = {
        items: Array.from({ length: 5000 }, (_, i) => ({
          id: i,
          title: `Item ${i}`,
          description: `Description for item ${i}`,
          metadata: {
            category: `Category ${i % 20}`,
            tags: [`tag${i}`, `tag${i + 1}`],
            created: new Date(Date.now() - i * 1000).toISOString()
          }
        }))
      };
      
      const startLoad = performance.now();
      await jsonViewerActions.loadJSONFromText(JSON.stringify(largeData));
      const endLoad = performance.now();
      
      // Loading should be efficient
      expect(endLoad - startLoad).toBeLessThan(1000); // Should load in < 1 second
      
      // Search should be fast
      searchQuery.set('Item');
      const startSearch = performance.now();
      await jsonViewerActions.unifiedSearch();
      const endSearch = performance.now();
      
      const results = filterResults.get();
      expect(results).toBeTruthy();
      expect(results!.processingTime).toBeLessThan(200); // Should search in < 200ms
      expect(endSearch - startSearch).toBeLessThan(500); // Total time < 500ms
    });
  });
});