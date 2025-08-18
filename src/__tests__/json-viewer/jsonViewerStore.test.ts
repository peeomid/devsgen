import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  originalJSON,
  parsedJSON,
  fileId,
  fileName,
  currentView,
  hasJSON,
  jsonViewerActions,
  activeFilterSets,
  filterResults
} from '../../stores/jsonViewerStore';

// Mock the services
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

vi.mock('../../services/JSONWorkerService', () => ({
  JSONWorkerService: {
    getInstance: () => ({
      initialize: vi.fn(),
      setJSON: vi.fn().mockResolvedValue(undefined),
      filterJSON: vi.fn().mockResolvedValue({
        filteredJSON: { test: 'filtered' },
        matchCount: 1,
        matchedPaths: ['test'],
        processingTime: 10
      }),
      clearJSON: vi.fn().mockResolvedValue(undefined)
    })
  }
}));

describe('JSON Viewer Store', () => {
  beforeEach(() => {
    // Reset store state
    originalJSON.set(null);
    parsedJSON.set(null);
    fileId.set(null);
    fileName.set(null);
    currentView.set('tree');
    activeFilterSets.set({});
    filterResults.set(null);
  });

  describe('Initial State', () => {
    it('should have correct initial values', () => {
      expect(originalJSON.get()).toBe(null);
      expect(parsedJSON.get()).toBe(null);
      expect(fileId.get()).toBe(null);
      expect(fileName.get()).toBe(null);
      expect(currentView.get()).toBe('tree');
      expect(hasJSON.get()).toBe(false);
    });
  });

  describe('JSON Loading', () => {
    it('should load JSON from text successfully', async () => {
      const testJSON = '{"name": "test", "value": 123}';
      
      await jsonViewerActions.loadJSONFromText(testJSON);
      
      expect(originalJSON.get()).toBe(testJSON);
      expect(parsedJSON.get()).toEqual({ name: 'test', value: 123 });
      expect(hasJSON.get()).toBe(true);
      expect(fileName.get()).toMatch(/pasted-.*\.json/);
    });

    it('should reject invalid JSON', async () => {
      const invalidJSON = '{"name": "test", "value":}';
      
      await expect(jsonViewerActions.loadJSONFromText(invalidJSON))
        .rejects.toThrow('Invalid JSON format');
    });

    it('should load JSON from file successfully', async () => {
      const testJSON = '{"users": [{"id": 1, "name": "Alice"}]}';
      const file = new File([testJSON], 'test.json', { type: 'application/json' });
      
      await jsonViewerActions.loadJSONFromFile(file);
      
      expect(originalJSON.get()).toBe(testJSON);
      expect(parsedJSON.get()).toEqual({ users: [{ id: 1, name: 'Alice' }] });
      expect(fileName.get()).toBe('test.json');
    });
  });

  describe('View Management', () => {
    it('should switch between tree and raw views', () => {
      expect(currentView.get()).toBe('tree');
      
      jsonViewerActions.setView('raw');
      expect(currentView.get()).toBe('raw');
      
      jsonViewerActions.setView('tree');
      expect(currentView.get()).toBe('tree');
    });
  });

  describe('Filter Management', () => {
    it('should add filter sets', async () => {
      const filterId = await jsonViewerActions.addFilterSet({
        name: 'Test Filter',
        type: 'value',
        values: ['test'],
        active: true
      });

      const filters = activeFilterSets.get();
      expect(Object.keys(filters)).toHaveLength(1);
      expect(filters[filterId].name).toBe('Test Filter');
      expect(filters[filterId].type).toBe('value');
      expect(filters[filterId].values).toEqual(['test']);
    });

    it('should remove filter sets', async () => {
      const filterId = await jsonViewerActions.addFilterSet({
        name: 'Test Filter',
        type: 'path',
        values: ['$.users[*]'],
        active: true
      });

      let filters = activeFilterSets.get();
      expect(Object.keys(filters)).toHaveLength(1);

      jsonViewerActions.removeFilterSet(filterId);
      
      filters = activeFilterSets.get();
      expect(Object.keys(filters)).toHaveLength(0);
    });

    it('should toggle filter sets', async () => {
      const filterId = await jsonViewerActions.addFilterSet({
        name: 'Test Filter',
        type: 'value',
        values: ['test'],
        active: true
      });

      let filters = activeFilterSets.get();
      expect(filters[filterId].active).toBe(true);

      jsonViewerActions.toggleFilterSet(filterId);
      
      filters = activeFilterSets.get();
      expect(filters[filterId].active).toBe(false);
    });

    it('should apply filters and update results', async () => {
      // First load some JSON
      await jsonViewerActions.loadJSONFromText('{"test": "value"}');

      // Add a filter
      await jsonViewerActions.addFilterSet({
        name: 'Test Filter',
        type: 'value',
        values: ['value'],
        active: true
      });

      // Check that filter results were set
      const results = filterResults.get();
      expect(results).toBeTruthy();
      expect(results?.matchCount).toBe(1);
    });
  });

  describe('Data Clearing', () => {
    it('should clear all JSON data', async () => {
      // First load some data
      await jsonViewerActions.loadJSONFromText('{"test": "data"}');
      await jsonViewerActions.addFilterSet({
        name: 'Test Filter',
        type: 'value',
        values: ['data'],
        active: true
      });

      expect(hasJSON.get()).toBe(true);
      expect(Object.keys(activeFilterSets.get())).toHaveLength(1);

      // Clear everything
      await jsonViewerActions.clearJSON();

      expect(originalJSON.get()).toBe(null);
      expect(parsedJSON.get()).toBe(null);
      expect(hasJSON.get()).toBe(false);
      expect(Object.keys(activeFilterSets.get())).toHaveLength(0);
      expect(filterResults.get()).toBe(null);
    });
  });

  describe('Computed Values', () => {
    it('should correctly compute hasJSON', () => {
      expect(hasJSON.get()).toBe(false);
      
      originalJSON.set('{}');
      parsedJSON.set({});
      expect(hasJSON.get()).toBe(true);
      
      originalJSON.set(null);
      expect(hasJSON.get()).toBe(false);
    });
  });
});