import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DatabaseService } from '../../services/DatabaseService';
import type { FileData, Line, CSVLine } from '../../types/database';

// Mock Dexie for testing
vi.mock('dexie', () => {
  const mockTable = {
    clear: vi.fn().mockResolvedValue(undefined),
    bulkAdd: vi.fn().mockResolvedValue(undefined),
    put: vi.fn().mockResolvedValue(undefined),
    get: vi.fn().mockResolvedValue(undefined),
    count: vi.fn().mockResolvedValue(0),
    orderBy: vi.fn().mockReturnThis(),
    offset: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    toArray: vi.fn().mockResolvedValue([]),
    where: vi.fn().mockReturnThis(),
    anyOf: vi.fn().mockReturnThis(),
    delete: vi.fn().mockResolvedValue(undefined)
  };

  const mockDb = {
    files: mockTable,
    lines: mockTable,
    csvLines: mockTable,
    transaction: vi.fn().mockImplementation((mode, tables, callback) => callback()),
    delete: vi.fn().mockResolvedValue(undefined)
  };

  return {
    default: class MockDexie {
      files = mockTable;
      lines = mockTable;
      csvLines = mockTable;
      
      constructor() {
        Object.assign(this, mockDb);
      }
      
      version() {
        return {
          stores: () => this
        };
      }
      
      transaction = mockDb.transaction;
      delete = mockDb.delete;
    }
  };
});

describe('DatabaseService', () => {
  let service: DatabaseService;

  beforeEach(() => {
    service = new DatabaseService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('storeTextLines', () => {
    it('should store text lines successfully', async () => {
      const lines = ['line 1', 'line 2', 'line 3'];
      
      await service.storeTextLines('file1', lines);
      
      expect(service['db'].transaction).toHaveBeenCalled();
      expect(service['db'].lines.clear).toHaveBeenCalled();
      expect(service['db'].lines.bulkAdd).toHaveBeenCalledWith([
        { content: 'line 1', lineNumber: 1 },
        { content: 'line 2', lineNumber: 2 },
        { content: 'line 3', lineNumber: 3 }
      ]);
    });

    it('should handle errors during text line storage', async () => {
      const lines = ['line 1'];
      service['db'].lines.bulkAdd = vi.fn().mockRejectedValue(new Error('Storage failed'));
      
      await expect(service.storeTextLines('file1', lines)).rejects.toThrow('Failed to store text lines: Storage failed');
    });
  });

  describe('storeCSVLines', () => {
    it('should store CSV lines successfully', async () => {
      const csvData = [['col1', 'col2'], ['val1', 'val2']];
      const headers = ['col1', 'col2'];
      
      await service.storeCSVLines('file1', csvData, headers);
      
      expect(service['db'].transaction).toHaveBeenCalled();
      expect(service['db'].csvLines.clear).toHaveBeenCalled();
      expect(service['db'].csvLines.bulkAdd).toHaveBeenCalledWith([
        { lineNumber: 1, data: ['col1', 'col2'], originalContent: 'col1,col2' },
        { lineNumber: 2, data: ['val1', 'val2'], originalContent: 'val1,val2' }
      ]);
    });

    it('should handle errors during CSV line storage', async () => {
      const csvData = [['col1', 'col2']];
      service['db'].csvLines.bulkAdd = vi.fn().mockRejectedValue(new Error('Storage failed'));
      
      await expect(service.storeCSVLines('file1', csvData)).rejects.toThrow('Failed to store CSV lines: Storage failed');
    });
  });

  describe('storeFileData', () => {
    it('should store file data successfully', async () => {
      const fileData: FileData = {
        id: 'file1',
        name: 'test.txt',
        type: 'text',
        size: 1000,
        lineCount: 10,
        uploadedAt: new Date()
      };
      
      await service.storeFileData(fileData);
      
      expect(service['db'].files.put).toHaveBeenCalledWith(fileData);
    });

    it('should handle errors during file data storage', async () => {
      const fileData: FileData = {
        id: 'file1',
        name: 'test.txt',
        type: 'text',
        size: 1000,
        lineCount: 10,
        uploadedAt: new Date()
      };
      service['db'].files.put = vi.fn().mockRejectedValue(new Error('Storage failed'));
      
      await expect(service.storeFileData(fileData)).rejects.toThrow('Failed to store file data: Storage failed');
    });
  });

  describe('getFileData', () => {
    it('should retrieve file data successfully', async () => {
      const fileData: FileData = {
        id: 'file1',
        name: 'test.txt',
        type: 'text',
        size: 1000,
        lineCount: 10,
        uploadedAt: new Date()
      };
      service['db'].files.get = vi.fn().mockResolvedValue(fileData);
      
      const result = await service.getFileData('file1');
      
      expect(result).toEqual(fileData);
      expect(service['db'].files.get).toHaveBeenCalledWith('file1');
    });

    it('should handle errors during file data retrieval', async () => {
      service['db'].files.get = vi.fn().mockRejectedValue(new Error('Retrieval failed'));
      
      await expect(service.getFileData('file1')).rejects.toThrow('Failed to get file data: Retrieval failed');
    });
  });

  describe('getTextLines', () => {
    it('should retrieve text lines with pagination', async () => {
      const mockLines: Line[] = [
        { id: 1, content: 'line 1', lineNumber: 1 },
        { id: 2, content: 'line 2', lineNumber: 2 }
      ];
      
      service['db'].lines.toArray = vi.fn().mockResolvedValue(mockLines);
      
      const result = await service.getTextLines(10, 0);
      
      expect(result).toEqual(mockLines);
      expect(service['db'].lines.orderBy).toHaveBeenCalledWith('lineNumber');
      expect(service['db'].lines.offset).toHaveBeenCalledWith(0);
      expect(service['db'].lines.limit).toHaveBeenCalledWith(10);
    });

    it('should retrieve all text lines when no pagination specified', async () => {
      const mockLines: Line[] = [
        { id: 1, content: 'line 1', lineNumber: 1 }
      ];
      
      service['db'].lines.toArray = vi.fn().mockResolvedValue(mockLines);
      
      const result = await service.getTextLines();
      
      expect(result).toEqual(mockLines);
      expect(service['db'].lines.orderBy).toHaveBeenCalledWith('lineNumber');
    });
  });

  describe('getLinesByNumbers', () => {
    it('should retrieve text lines by line numbers', async () => {
      const lineNumbers = [1, 3, 5];
      const mockLines: Line[] = [
        { id: 1, content: 'line 1', lineNumber: 1 },
        { id: 3, content: 'line 3', lineNumber: 3 },
        { id: 5, content: 'line 5', lineNumber: 5 }
      ];
      
      service['db'].lines.toArray = vi.fn().mockResolvedValue(mockLines);
      
      const result = await service.getLinesByNumbers(lineNumbers, 'text');
      
      expect(result).toEqual(mockLines);
      expect(service['db'].lines.where).toHaveBeenCalledWith('lineNumber');
      expect(service['db'].lines.anyOf).toHaveBeenCalledWith(lineNumbers);
    });

    it('should retrieve CSV lines by line numbers', async () => {
      const lineNumbers = [1, 2];
      const mockLines: CSVLine[] = [
        { id: 1, lineNumber: 1, data: ['col1', 'col2'], originalContent: 'col1,col2' },
        { id: 2, lineNumber: 2, data: ['val1', 'val2'], originalContent: 'val1,val2' }
      ];
      
      service['db'].csvLines.toArray = vi.fn().mockResolvedValue(mockLines);
      
      const result = await service.getLinesByNumbers(lineNumbers, 'csv');
      
      expect(result).toEqual(mockLines);
      expect(service['db'].csvLines.where).toHaveBeenCalledWith('lineNumber');
      expect(service['db'].csvLines.anyOf).toHaveBeenCalledWith(lineNumbers);
    });
  });

  describe('getLineCount', () => {
    it('should return line counts for both text and CSV', async () => {
      service['db'].lines.count = vi.fn().mockResolvedValue(100);
      service['db'].csvLines.count = vi.fn().mockResolvedValue(50);
      
      const result = await service.getLineCount();
      
      expect(result).toEqual({ text: 100, csv: 50 });
    });
  });

  describe('clearData', () => {
    it('should clear all data successfully', async () => {
      await service.clearData();
      
      expect(service['db'].transaction).toHaveBeenCalled();
      expect(service['db'].files.clear).toHaveBeenCalled();
      expect(service['db'].lines.clear).toHaveBeenCalled();
      expect(service['db'].csvLines.clear).toHaveBeenCalled();
    });

    it('should handle errors during data clearing', async () => {
      service['db'].transaction = vi.fn().mockRejectedValue(new Error('Clear failed'));
      
      await expect(service.clearData()).rejects.toThrow('Failed to clear data: Clear failed');
    });
  });

  describe('deleteDatabase', () => {
    it('should delete the database successfully', async () => {
      await service.deleteDatabase();
      
      expect(service['db'].delete).toHaveBeenCalled();
    });

    it('should handle errors during database deletion', async () => {
      service['db'].delete = vi.fn().mockRejectedValue(new Error('Delete failed'));
      
      await expect(service.deleteDatabase()).rejects.toThrow('Failed to delete database: Delete failed');
    });
  });
});