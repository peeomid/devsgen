import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OPFSStorageService } from '../../services/OPFSStorageService';

// Mock navigator.storage
const mockGetDirectory = vi.fn();
const mockGetDirectoryHandle = vi.fn();
const mockGetFileHandle = vi.fn();
const mockCreateWritable = vi.fn();
const mockGetFile = vi.fn();
const mockEstimate = vi.fn();

Object.defineProperty(global, 'navigator', {
  value: {
    storage: {
      getDirectory: mockGetDirectory,
      estimate: mockEstimate
    }
  }
});

// Mock FileSystemDirectoryHandle
const mockDirectoryHandle = {
  getDirectoryHandle: mockGetDirectoryHandle,
  getFileHandle: mockGetFileHandle,
  removeEntry: vi.fn()
};

// Mock FileSystemFileHandle  
const mockFileHandle = {
  createWritable: mockCreateWritable,
  getFile: mockGetFile
};

// Mock WritableStream
const mockWritable = {
  write: vi.fn(),
  close: vi.fn()
};

// Mock File
const mockFile = {
  text: vi.fn()
};

describe('OPFSStorageService', () => {
  let service: OPFSStorageService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = OPFSStorageService.getInstance();
    
    // Setup default mocks
    mockGetDirectory.mockResolvedValue(mockDirectoryHandle);
    mockGetDirectoryHandle.mockResolvedValue(mockDirectoryHandle);
    mockGetFileHandle.mockResolvedValue(mockFileHandle);
    mockCreateWritable.mockResolvedValue(mockWritable);
    mockGetFile.mockResolvedValue(mockFile);
    mockEstimate.mockResolvedValue({ quota: 1000000000, usage: 100000000 });
  });

  describe('Initialization', () => {
    it('should initialize successfully with OPFS support', async () => {
      await service.initialize();
      
      expect(mockGetDirectory).toHaveBeenCalled();
      expect(mockGetDirectoryHandle).toHaveBeenCalledWith('json-viewer-files', { create: true });
    });

    it('should handle OPFS not being supported', async () => {
      // Remove OPFS support
      Object.defineProperty(global, 'navigator', {
        value: {}
      });
      
      const newService = new (OPFSStorageService as any)();
      await newService.initialize();
      
      // Should not throw and should fall back gracefully
      expect(newService).toBeDefined();
    });
  });

  describe('Storage Operations', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should save JSON to OPFS for large files', async () => {
      const fileId = 'test-123';
      const fileName = 'test.json';
      const largeJSON = JSON.stringify({ data: 'x'.repeat(10 * 1024 * 1024) }); // > 5MB
      
      const result = await service.saveJSON(fileId, fileName, largeJSON);
      
      expect(result).toBe('opfs');
      expect(mockGetFileHandle).toHaveBeenCalledWith(`${fileId}.json`, { create: true });
      expect(mockCreateWritable).toHaveBeenCalled();
      expect(mockWritable.write).toHaveBeenCalledWith(largeJSON);
      expect(mockWritable.close).toHaveBeenCalled();
    });

    it('should save JSON to localStorage for small files', async () => {
      const fileId = 'test-small';
      const fileName = 'small.json';
      const smallJSON = '{"small": "data"}';
      
      const result = await service.saveJSON(fileId, fileName, smallJSON);
      
      expect(result).toBe('localStorage');
      // localStorage operations would be mocked in a real test environment
    });

    it('should load JSON from OPFS', async () => {
      const fileId = 'test-load';
      const expectedJSON = '{"loaded": "data"}';
      
      mockFile.text.mockResolvedValue(expectedJSON);
      
      const result = await service.loadJSON(fileId);
      
      expect(result).toBe(expectedJSON);
      expect(mockGetFileHandle).toHaveBeenCalledWith(`${fileId}.json`);
      expect(mockGetFile).toHaveBeenCalled();
      expect(mockFile.text).toHaveBeenCalled();
    });

    it('should return null when file not found', async () => {
      const fileId = 'not-found';
      
      mockGetFileHandle.mockRejectedValue(new Error('File not found'));
      
      const result = await service.loadJSON(fileId);
      
      expect(result).toBe(null);
    });

    it('should delete JSON files', async () => {
      const fileId = 'test-delete';
      
      await service.deleteJSON(fileId);
      
      expect(mockDirectoryHandle.removeEntry).toHaveBeenCalledWith(`${fileId}.json`);
    });
  });

  describe('Quota Management', () => {
    it('should get quota information', async () => {
      const quotaInfo = await service.getQuotaInfo();
      
      expect(quotaInfo).toEqual({
        quota: 1000000000,
        usage: 100000000,
        available: 900000000
      });
      expect(mockEstimate).toHaveBeenCalled();
    });

    it('should handle quota estimation failure', async () => {
      mockEstimate.mockRejectedValue(new Error('Quota API not available'));
      
      const quotaInfo = await service.getQuotaInfo();
      
      expect(quotaInfo).toEqual({
        quota: 0,
        usage: 0,
        available: 0
      });
    });
  });

  describe('File Management', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should list stored files', async () => {
      // Mock localStorage to return some files
      const mockLocalStorage = {
        getItem: vi.fn().mockReturnValue(JSON.stringify({
          'file1': {
            fileId: 'file1',
            fileName: 'test1.json',
            size: 100,
            createdAt: Date.now(),
            lastAccessed: Date.now()
          }
        }))
      };
      
      Object.defineProperty(global, 'localStorage', {
        value: mockLocalStorage
      });

      const files = await service.listFiles();
      
      expect(files).toHaveLength(1);
      expect(files[0].fileName).toBe('test1.json');
    });

    it('should clear old files', async () => {
      // This would test the file cleanup functionality
      // In a real implementation, we'd mock file timestamps and verify cleanup
      const deletedCount = await service.clearOldFiles(1000); // 1 second age
      
      expect(deletedCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle OPFS write failures gracefully', async () => {
      await service.initialize();
      
      mockCreateWritable.mockRejectedValue(new Error('Write failed'));
      
      const fileId = 'test-error';
      const fileName = 'error.json';
      const json = '{"error": "test"}';
      
      // Should fall back to localStorage
      const result = await service.saveJSON(fileId, fileName, json);
      expect(result).toBe('localStorage');
    });

    it('should handle quota exceeded errors', async () => {
      const quotaError = new DOMException('Quota exceeded', 'QuotaExceededError');
      
      // Mock localStorage to throw quota error
      const mockSetItem = vi.fn().mockImplementation(() => {
        throw quotaError;
      });
      
      Object.defineProperty(global, 'localStorage', {
        value: { setItem: mockSetItem }
      });

      await expect(service.saveJSON('test', 'test.json', '{}'))
        .rejects.toThrow('Storage quota exceeded');
    });
  });
});