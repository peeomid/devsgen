interface StorageQuotaInfo {
  quota: number;
  usage: number;
  available: number;
}

interface StoredFileInfo {
  fileId: string;
  fileName: string;
  size: number;
  createdAt: number;
  lastAccessed: number;
}

export class OPFSStorageService {
  private static instance: OPFSStorageService;
  private directoryHandle: FileSystemDirectoryHandle | null = null;
  private isSupported: boolean = false;
  private readonly DIRECTORY_NAME = 'json-viewer-files';
  private readonly MAX_MEMORY_SIZE = 5 * 1024 * 1024; // 5MB
  private readonly INDEX_KEY = 'json-viewer-file-index';

  constructor() {
    this.checkSupport();
  }

  static getInstance(): OPFSStorageService {
    if (!OPFSStorageService.instance) {
      OPFSStorageService.instance = new OPFSStorageService();
    }
    return OPFSStorageService.instance;
  }

  private checkSupport(): void {
    this.isSupported = 'navigator' in globalThis && 
                      'storage' in navigator && 
                      'getDirectory' in navigator.storage;
  }

  async initialize(): Promise<void> {
    if (!this.isSupported) {
      console.warn('OPFS not supported, falling back to localStorage');
      return;
    }

    try {
      const opfsRoot = await navigator.storage.getDirectory();
      this.directoryHandle = await opfsRoot.getDirectoryHandle(
        this.DIRECTORY_NAME, 
        { create: true }
      );
    } catch (error) {
      console.error('Failed to initialize OPFS:', error);
      this.isSupported = false;
    }
  }

  async getQuotaInfo(): Promise<StorageQuotaInfo> {
    if (!this.isSupported) {
      // Estimate localStorage usage
      const used = new Blob([JSON.stringify(localStorage)]).size;
      return {
        quota: 10 * 1024 * 1024, // 10MB estimate for localStorage
        usage: used,
        available: (10 * 1024 * 1024) - used
      };
    }

    try {
      const estimate = await navigator.storage.estimate();
      return {
        quota: estimate.quota || 0,
        usage: estimate.usage || 0,
        available: (estimate.quota || 0) - (estimate.usage || 0)
      };
    } catch (error) {
      console.error('Failed to get quota info:', error);
      return { quota: 0, usage: 0, available: 0 };
    }
  }

  async saveJSON(fileId: string, fileName: string, jsonContent: string): Promise<'opfs' | 'localStorage'> {
    const size = new Blob([jsonContent]).size;
    
    // Use localStorage for small files or if OPFS not available
    if (!this.isSupported || size < this.MAX_MEMORY_SIZE) {
      return this.saveToLocalStorage(fileId, fileName, jsonContent);
    }

    return this.saveToOPFS(fileId, fileName, jsonContent);
  }

  private async saveToOPFS(fileId: string, fileName: string, jsonContent: string): Promise<'opfs'> {
    if (!this.directoryHandle) {
      await this.initialize();
    }

    if (!this.directoryHandle) {
      throw new Error('OPFS not available');
    }

    try {
      const fileHandle = await this.directoryHandle.getFileHandle(
        `${fileId}.json`, 
        { create: true }
      );
      
      const writable = await fileHandle.createWritable();
      await writable.write(jsonContent);
      await writable.close();

      // Update file index
      await this.updateFileIndex(fileId, fileName, jsonContent.length);

      return 'opfs';
    } catch (error) {
      console.error('Failed to save to OPFS:', error);
      // Fallback to localStorage
      return this.saveToLocalStorage(fileId, fileName, jsonContent);
    }
  }

  private async saveToLocalStorage(fileId: string, fileName: string, jsonContent: string): Promise<'localStorage'> {
    try {
      localStorage.setItem(`json-viewer-${fileId}`, jsonContent);
      
      // Update file index in localStorage
      const index = this.getLocalStorageIndex();
      index[fileId] = {
        fileId,
        fileName,
        size: jsonContent.length,
        createdAt: Date.now(),
        lastAccessed: Date.now()
      };
      localStorage.setItem(this.INDEX_KEY, JSON.stringify(index));

      return 'localStorage';
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        throw new Error('Storage quota exceeded. Please clear some space or use a smaller file.');
      }
      throw error;
    }
  }

  async loadJSON(fileId: string): Promise<string | null> {
    // Try OPFS first
    if (this.isSupported && this.directoryHandle) {
      try {
        const fileHandle = await this.directoryHandle.getFileHandle(`${fileId}.json`);
        const file = await fileHandle.getFile();
        const content = await file.text();
        
        // Update last accessed time
        await this.updateLastAccessed(fileId);
        
        return content;
      } catch (error) {
        // File not found in OPFS, try localStorage
      }
    }

    // Try localStorage
    const content = localStorage.getItem(`json-viewer-${fileId}`);
    if (content) {
      // Update last accessed time
      this.updateLastAccessedLocalStorage(fileId);
    }
    
    return content;
  }

  async deleteJSON(fileId: string): Promise<void> {
    // Delete from OPFS
    if (this.directoryHandle) {
      try {
        await this.directoryHandle.removeEntry(`${fileId}.json`);
      } catch (error) {
        // File might not exist in OPFS
      }
    }

    // Delete from localStorage
    localStorage.removeItem(`json-viewer-${fileId}`);
    
    // Update index
    await this.removeFromIndex(fileId);
  }

  async listFiles(): Promise<StoredFileInfo[]> {
    const files: StoredFileInfo[] = [];

    // Get files from localStorage index
    const localIndex = this.getLocalStorageIndex();
    files.push(...Object.values(localIndex));

    // Get files from OPFS index (if available)
    if (this.directoryHandle) {
      try {
        const opfsIndex = await this.getOPFSIndex();
        files.push(...Object.values(opfsIndex));
      } catch (error) {
        console.warn('Failed to read OPFS index:', error);
      }
    }

    // Remove duplicates and sort by last accessed
    const uniqueFiles = files.reduce((acc, file) => {
      if (!acc[file.fileId] || acc[file.fileId].lastAccessed < file.lastAccessed) {
        acc[file.fileId] = file;
      }
      return acc;
    }, {} as Record<string, StoredFileInfo>);

    return Object.values(uniqueFiles).sort((a, b) => b.lastAccessed - a.lastAccessed);
  }

  async clearOldFiles(maxAge: number = 7 * 24 * 60 * 60 * 1000): Promise<number> {
    const files = await this.listFiles();
    const now = Date.now();
    let deletedCount = 0;

    for (const file of files) {
      if (now - file.lastAccessed > maxAge) {
        await this.deleteJSON(file.fileId);
        deletedCount++;
      }
    }

    return deletedCount;
  }

  private getLocalStorageIndex(): Record<string, StoredFileInfo> {
    try {
      const indexData = localStorage.getItem(this.INDEX_KEY);
      return indexData ? JSON.parse(indexData) : {};
    } catch (error) {
      console.error('Failed to parse localStorage index:', error);
      return {};
    }
  }

  private async getOPFSIndex(): Promise<Record<string, StoredFileInfo>> {
    if (!this.directoryHandle) return {};

    try {
      const indexHandle = await this.directoryHandle.getFileHandle('index.json');
      const indexFile = await indexHandle.getFile();
      const indexData = await indexFile.text();
      return JSON.parse(indexData);
    } catch (error) {
      return {};
    }
  }

  private async updateFileIndex(fileId: string, fileName: string, size: number): Promise<void> {
    const fileInfo: StoredFileInfo = {
      fileId,
      fileName,
      size,
      createdAt: Date.now(),
      lastAccessed: Date.now()
    };

    if (this.directoryHandle) {
      try {
        const index = await this.getOPFSIndex();
        index[fileId] = fileInfo;
        
        const indexHandle = await this.directoryHandle.getFileHandle('index.json', { create: true });
        const writable = await indexHandle.createWritable();
        await writable.write(JSON.stringify(index, null, 2));
        await writable.close();
      } catch (error) {
        console.error('Failed to update OPFS index:', error);
      }
    }
  }

  private async updateLastAccessed(fileId: string): Promise<void> {
    if (this.directoryHandle) {
      try {
        const index = await this.getOPFSIndex();
        if (index[fileId]) {
          index[fileId].lastAccessed = Date.now();
          
          const indexHandle = await this.directoryHandle.getFileHandle('index.json', { create: true });
          const writable = await indexHandle.createWritable();
          await writable.write(JSON.stringify(index, null, 2));
          await writable.close();
        }
      } catch (error) {
        console.error('Failed to update last accessed time:', error);
      }
    }
  }

  private updateLastAccessedLocalStorage(fileId: string): void {
    const index = this.getLocalStorageIndex();
    if (index[fileId]) {
      index[fileId].lastAccessed = Date.now();
      localStorage.setItem(this.INDEX_KEY, JSON.stringify(index));
    }
  }

  private async removeFromIndex(fileId: string): Promise<void> {
    // Remove from localStorage index
    const localIndex = this.getLocalStorageIndex();
    delete localIndex[fileId];
    localStorage.setItem(this.INDEX_KEY, JSON.stringify(localIndex));

    // Remove from OPFS index
    if (this.directoryHandle) {
      try {
        const opfsIndex = await this.getOPFSIndex();
        delete opfsIndex[fileId];
        
        const indexHandle = await this.directoryHandle.getFileHandle('index.json', { create: true });
        const writable = await indexHandle.createWritable();
        await writable.write(JSON.stringify(opfsIndex, null, 2));
        await writable.close();
      } catch (error) {
        console.error('Failed to update OPFS index:', error);
      }
    }
  }
}