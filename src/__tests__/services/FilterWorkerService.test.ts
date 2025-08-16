import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FilterWorkerService } from '../../services/FilterWorkerService';
import type { Line, CSVLine } from '../../types/database';

// Mock Worker
global.Worker = class MockWorker extends EventTarget {
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  
  constructor(public url: string) {
    super();
  }
  
  postMessage(data: any) {
    // Simulate worker responses based on message type
    setTimeout(() => {
      const event = new MessageEvent('message', { data: this.mockResponse(data) });
      if (this.onmessage) {
        this.onmessage(event);
      }
      this.dispatchEvent(event);
    }, 10);
  }
  
  terminate() {
    // Mock terminate
  }
  
  private mockResponse(data: any) {
    switch (data.type) {
      case 'setData':
        return { type: 'dataSet', payload: { success: true } };
      case 'filter':
        return {
          type: 'complete',
          payload: {
            filterId: data.payload.filterId,
            matchedLines: [1, 2, 3],
            totalMatches: 3,
            processingTime: 50
          }
        };
      case 'clear':
        return { type: 'dataCleared', payload: { success: true } };
      default:
        return { type: 'ready', payload: { message: 'Filter worker ready' } };
    }
  }
} as any;

describe('FilterWorkerService', () => {
  let service: FilterWorkerService;
  let mockTextData: Line[];
  let mockCSVData: CSVLine[];

  beforeEach(() => {
    service = new FilterWorkerService();
    mockTextData = [
      { id: 1, content: 'error: something went wrong', lineNumber: 1 },
      { id: 2, content: 'info: process started', lineNumber: 2 },
      { id: 3, content: 'error: another issue', lineNumber: 3 }
    ];
    mockCSVData = [
      { id: 1, lineNumber: 1, data: ['John', '25', 'Engineer'], originalContent: 'John,25,Engineer' },
      { id: 2, lineNumber: 2, data: ['Jane', '30', 'Designer'], originalContent: 'Jane,30,Designer' }
    ];
  });

  afterEach(() => {
    if (service.isReady()) {
      service.terminate();
    }
    vi.clearAllMocks();
  });

  describe('initialize', () => {
    it('should initialize the worker successfully', async () => {
      await service.initialize();
      
      expect(service.isReady()).toBe(true);
    });

    it('should not initialize multiple times', async () => {
      await service.initialize();
      const isReadyFirst = service.isReady();
      
      await service.initialize();
      const isReadySecond = service.isReady();
      
      expect(isReadyFirst).toBe(true);
      expect(isReadySecond).toBe(true);
    });

    it('should handle initialization timeout', async () => {
      // Mock a worker that doesn't respond
      global.Worker = class TimeoutWorker extends EventTarget {
        constructor() { super(); }
        postMessage() {}
        terminate() {}
      } as any;
      
      const timeoutService = new FilterWorkerService();
      
      await expect(timeoutService.initialize()).rejects.toThrow('Worker initialization timeout');
    });
  });

  describe('setData', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should set text data successfully', async () => {
      await service.setData(mockTextData, 'text');
      
      expect(service.hasData()).toBe(true);
      expect(service.getDataInfo()).toEqual({
        lineCount: mockTextData.length,
        dataType: 'text'
      });
    });

    it('should set CSV data successfully', async () => {
      await service.setData(mockCSVData, 'csv');
      
      expect(service.hasData()).toBe(true);
      expect(service.getDataInfo()).toEqual({
        lineCount: mockCSVData.length,
        dataType: 'csv'
      });
    });

    it('should throw error if worker not initialized', async () => {
      const uninitializedService = new FilterWorkerService();
      
      await expect(uninitializedService.setData(mockTextData, 'text'))
        .rejects.toThrow('Worker not initialized');
    });
  });

  describe('filter', () => {
    beforeEach(async () => {
      await service.initialize();
      await service.setData(mockTextData, 'text');
    });

    it('should filter data successfully', async () => {
      const options = {
        filterId: 'filter1',
        pattern: 'error',
        filterType: 'include' as const,
        caseSensitive: false,
        useRegex: false
      };

      const result = await service.filter(options);

      expect(result).toEqual({
        filterId: 'filter1',
        matchedLines: [1, 2, 3],
        totalMatches: 3,
        processingTime: 50
      });
    });

    it('should handle filter with callbacks', async () => {
      const onProgress = vi.fn();
      const onComplete = vi.fn();
      const onError = vi.fn();

      const options = {
        filterId: 'filter2',
        pattern: 'info',
        filterType: 'include' as const,
        caseSensitive: false,
        useRegex: false
      };

      await service.filter(options, { onProgress, onComplete, onError });

      expect(onComplete).toHaveBeenCalled();
      expect(onError).not.toHaveBeenCalled();
    });

    it('should throw error if no data loaded', async () => {
      const emptyService = new FilterWorkerService();
      await emptyService.initialize();

      const options = {
        filterId: 'filter3',
        pattern: 'test',
        filterType: 'include' as const,
        caseSensitive: false,
        useRegex: false
      };

      await expect(emptyService.filter(options)).rejects.toThrow('No data loaded in worker');
    });

    it('should handle CSV column filtering', async () => {
      await service.setData(mockCSVData, 'csv');

      const options = {
        filterId: 'filter4',
        pattern: 'Engineer',
        filterType: 'include' as const,
        caseSensitive: false,
        useRegex: false,
        columnIndex: 2,
        scope: 'column' as const
      };

      const result = await service.filter(options);

      expect(result.filterId).toBe('filter4');
      expect(result.matchedLines).toEqual([1, 2, 3]);
    });

    it('should handle regex patterns', async () => {
      const options = {
        filterId: 'filter5',
        pattern: '^error:',
        filterType: 'include' as const,
        caseSensitive: false,
        useRegex: true
      };

      const result = await service.filter(options);

      expect(result.filterId).toBe('filter5');
      expect(result.totalMatches).toBe(3);
    });
  });

  describe('clearData', () => {
    beforeEach(async () => {
      await service.initialize();
      await service.setData(mockTextData, 'text');
    });

    it('should clear data successfully', () => {
      expect(service.hasData()).toBe(true);
      
      service.clearData();
      
      expect(service.hasData()).toBe(false);
      expect(service.getDataInfo()).toEqual({
        lineCount: 0,
        dataType: null
      });
    });
  });

  describe('terminate', () => {
    it('should terminate the worker and reset state', async () => {
      await service.initialize();
      await service.setData(mockTextData, 'text');
      
      expect(service.isReady()).toBe(true);
      expect(service.hasData()).toBe(true);
      
      service.terminate();
      
      expect(service.isReady()).toBe(false);
      expect(service.hasData()).toBe(false);
    });

    it('should handle multiple terminate calls', async () => {
      await service.initialize();
      
      service.terminate();
      service.terminate(); // Should not throw
      
      expect(service.isReady()).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should handle worker errors', async () => {
      // Mock a worker that throws errors
      global.Worker = class ErrorWorker extends EventTarget {
        constructor() { super(); }
        postMessage(data: any) {
          setTimeout(() => {
            const event = new MessageEvent('message', {
              data: { type: 'error', payload: { error: 'Mock worker error' } }
            });
            this.dispatchEvent(event);
          }, 10);
        }
        terminate() {}
      } as any;

      const errorService = new FilterWorkerService();
      await errorService.initialize();
      await errorService.setData(mockTextData, 'text');

      const options = {
        filterId: 'error-filter',
        pattern: 'test',
        filterType: 'include' as const,
        caseSensitive: false,
        useRegex: false
      };

      await expect(errorService.filter(options)).rejects.toThrow('Mock worker error');
    });

    it('should handle worker message errors', async () => {
      await service.initialize();
      
      const worker = service['worker'];
      if (worker) {
        // Simulate a message error
        const errorEvent = new Event('messageerror') as any;
        worker.dispatchEvent(errorEvent);
      }
      
      // Should not throw, just log the error
      expect(service.isReady()).toBe(true);
    });
  });

  describe('getDataInfo', () => {
    it('should return correct data info when no data loaded', () => {
      const info = service.getDataInfo();
      
      expect(info).toEqual({
        lineCount: 0,
        dataType: null
      });
    });

    it('should return correct data info after loading data', async () => {
      await service.initialize();
      await service.setData(mockTextData, 'text');
      
      const info = service.getDataInfo();
      
      expect(info).toEqual({
        lineCount: mockTextData.length,
        dataType: 'text'
      });
    });
  });
});