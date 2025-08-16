import { atom, computed, map } from 'nanostores';
import type { LineFilterState, DataType, ProcessingStatus } from '../types/lineFilter';
import type { TextFilter, CSVFilter, FilterResult } from '../types/filters';
import type { Line, CSVLine, FileData } from '../types/database';
import { databaseService } from '../services/DatabaseService';
import { fileParserService } from '../services/FileParserService';
import { filterWorkerService } from '../services/FilterWorkerService';

// Core data atoms
export const dataType = atom<DataType>('none');
export const lineCount = atom<number>(0);
export const csvHeaders = atom<string[]>([]);
export const hasHeaders = atom<boolean>(true);
export const delimiter = atom<string>(',');
export const fileId = atom<string | null>(null);
export const fileName = atom<string | null>(null);

// Processing atoms
export const processingStatus = atom<ProcessingStatus>('idle');
export const processingProgress = atom<number>(0);
export const processingError = atom<string | null>(null);

// Filter atoms
export const activeFilters = map<Record<string, TextFilter | CSVFilter>>({});
export const filterResults = map<Record<string, FilterResult>>({});
export const isFiltering = atom<boolean>(false);
export const lastFilterTime = atom<number>(0);

// UI atoms
export const isModalOpen = atom<boolean>(false);
export const selectedFilter = atom<string | null>(null);
export const currentPage = atom<number>(1);
export const pageSize = atom<number>(100);
export const focusedElement = atom<string | null>(null);

// Computed values
export const hasData = computed([dataType, lineCount], (type, count) => {
  return type !== 'none' && count > 0;
});

export const canFilter = computed([hasData, isFiltering], (hasDataValue, filtering) => {
  return hasDataValue && !filtering;
});

export const activeFilterCount = computed(activeFilters, (filters) => {
  return Object.keys(filters).length;
});

export const totalFilteredResults = computed(filterResults, (results) => {
  return Object.values(results).reduce((total, result) => total + result.totalMatches, 0);
});

export const isProcessing = computed(processingStatus, (status) => {
  return status !== 'idle' && status !== 'complete' && status !== 'error';
});

// Store actions
export const lineFilterActions = {
  // Data loading actions
  async loadFile(file: File): Promise<void> {
    try {
      processingStatus.set('uploading');
      processingProgress.set(0);
      processingError.set(null);

      // Use current hasHeaders setting for parsing
      const currentHasHeaders = hasHeaders.get();
      const parsed = await fileParserService.parseFile(file, currentHasHeaders);
      
      processingStatus.set('parsing');
      processingProgress.set(30);

      // Store file data
      const fileData: FileData = {
        ...parsed.fileInfo,
        uploadedAt: new Date()
      };
      
      await databaseService.storeFileData(fileData);
      
      processingProgress.set(60);

      // Store line data
      if (parsed.fileInfo.type === 'csv' && parsed.data.csvData) {
        // Store original lines for potential re-parsing
        const content = await file.text();
        const originalLines = content.split(/\r?\n/).filter(line => line.trim().length > 0);
        await databaseService.storeOriginalLines(fileData.id, originalLines);
        
        await databaseService.storeCSVLines(fileData.id, parsed.data.csvData, parsed.data.headers);
        csvHeaders.set(parsed.data.headers || []);
        delimiter.set(parsed.delimiter || ',');
      } else if (parsed.data.lines) {
        await databaseService.storeTextLines(fileData.id, parsed.data.lines);
      }

      processingProgress.set(80);

      // Initialize worker with data
      if (!filterWorkerService.isReady()) {
        await filterWorkerService.initialize();
      }

      let workerData: (Line | CSVLine)[];
      if (parsed.fileInfo.type === 'csv') {
        workerData = await databaseService.getAllCSVLinesForFiltering();
      } else {
        workerData = await databaseService.getAllTextLinesForFiltering();
      }

      await filterWorkerService.setData(workerData, parsed.fileInfo.type);

      // Update state
      dataType.set(parsed.fileInfo.type);
      lineCount.set(parsed.fileInfo.lineCount);
      fileId.set(fileData.id);
      fileName.set(fileData.name);
      
      processingProgress.set(100);
      processingStatus.set('complete');
      
      // Save state after successful load
      saveStateToStorage();

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load file';
      processingError.set(errorMessage);
      processingStatus.set('error');
      throw error;
    }
  },

  async loadText(text: string): Promise<void> {
    try {
      processingStatus.set('parsing');
      processingProgress.set(0);
      processingError.set(null);

      // Use current hasHeaders setting for parsing
      const currentHasHeaders = hasHeaders.get();
      const parsed = fileParserService.parseText(text, currentHasHeaders);
      
      processingProgress.set(30);

      // Store file data
      const fileData: FileData = {
        ...parsed.fileInfo,
        uploadedAt: new Date()
      };
      
      await databaseService.storeFileData(fileData);
      
      processingProgress.set(60);

      // Store line data
      if (parsed.fileInfo.type === 'csv' && parsed.data.csvData) {
        // Store original lines for potential re-parsing
        const originalLines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
        await databaseService.storeOriginalLines(fileData.id, originalLines);
        
        await databaseService.storeCSVLines(fileData.id, parsed.data.csvData, parsed.data.headers);
        csvHeaders.set(parsed.data.headers || []);
        delimiter.set(parsed.delimiter || ',');
      } else if (parsed.data.lines) {
        await databaseService.storeTextLines(fileData.id, parsed.data.lines);
      }

      processingProgress.set(80);

      // Initialize worker with data
      if (!filterWorkerService.isReady()) {
        await filterWorkerService.initialize();
      }

      let workerData: (Line | CSVLine)[];
      if (parsed.fileInfo.type === 'csv') {
        workerData = await databaseService.getAllCSVLinesForFiltering();
      } else {
        workerData = await databaseService.getAllTextLinesForFiltering();
      }

      await filterWorkerService.setData(workerData, parsed.fileInfo.type);

      // Update state
      dataType.set(parsed.fileInfo.type);
      lineCount.set(parsed.fileInfo.lineCount);
      fileId.set(fileData.id);
      fileName.set(fileData.name);
      
      processingProgress.set(100);
      processingStatus.set('complete');
      
      // Save state after successful load
      saveStateToStorage();

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load text';
      processingError.set(errorMessage);
      processingStatus.set('error');
      throw error;
    }
  },

  // Filter management actions
  async addFilter(filter: TextFilter | CSVFilter): Promise<void> {
    const currentFilters = activeFilters.get();
    activeFilters.set({
      ...currentFilters,
      [filter.id]: filter
    });
    
    // Auto-apply the filter immediately for better UX
    try {
      await this.applyFilter(filter.id);
      // Save state after successful filter addition
      saveStateToStorage();
    } catch (error) {
      console.error('Failed to auto-apply filter:', error);
      // If auto-apply fails, remove the filter to maintain consistency
      this.removeFilter(filter.id);
      throw error;
    }
  },

  removeFilter(filterId: string): void {
    const currentFilters = activeFilters.get();
    const newFilters = { ...currentFilters };
    delete newFilters[filterId];
    activeFilters.set(newFilters);

    // Also remove results
    const currentResults = filterResults.get();
    const newResults = { ...currentResults };
    delete newResults[filterId];
    filterResults.set(newResults);

    // Reset to page 1 when filter results change
    currentPage.set(1);
    
    // Save state after filter removal
    saveStateToStorage();
  },

  updateFilter(filterId: string, updates: Partial<TextFilter | CSVFilter>): void {
    const currentFilters = activeFilters.get();
    const filter = currentFilters[filterId];
    if (filter) {
      activeFilters.set({
        ...currentFilters,
        [filterId]: { ...filter, ...updates }
      });
      // Save state after filter update
      saveStateToStorage();
    }
  },

  toggleFilter(filterId: string): void {
    const currentFilters = activeFilters.get();
    const filter = currentFilters[filterId];
    if (filter) {
      this.updateFilter(filterId, { isActive: !filter.isActive });
    }
  },

  // Filtering actions
  async applyFilter(filterId: string): Promise<FilterResult> {
    const filter = activeFilters.get()[filterId];
    if (!filter) {
      throw new Error('Filter not found');
    }

    try {
      isFiltering.set(true);
      processingError.set(null);

      const options = {
        filterId: filter.id,
        pattern: filter.pattern,
        patterns: filter.patterns, // Add patterns array for OR logic
        filterType: filter.type,
        caseSensitive: filter.caseSensitive,
        useRegex: filter.useRegex,
        columnIndex: 'columnIndex' in filter ? filter.columnIndex : undefined,
        scope: 'scope' in filter ? filter.scope : 'all' as const
      };

      const result = await filterWorkerService.filter(options, {
        onProgress: (filterId, progress) => {
          processingProgress.set(progress);
        },
        onError: (filterId, error) => {
          processingError.set(error);
        }
      });

      // Store result
      const currentResults = filterResults.get();
      filterResults.set({
        ...currentResults,
        [filterId]: result
      });

      // Reset to page 1 when filter results change
      currentPage.set(1);

      lastFilterTime.set(Date.now());
      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Filter operation failed';
      processingError.set(errorMessage);
      throw error;
    } finally {
      isFiltering.set(false);
    }
  },

  async applyAllActiveFilters(): Promise<void> {
    const filters = activeFilters.get();
    const activeFilterIds = Object.keys(filters).filter(id => filters[id].isActive);

    for (const filterId of activeFilterIds) {
      await this.applyFilter(filterId);
    }
  },

  clearFilters(): void {
    activeFilters.set({});
    filterResults.set({});
    // Reset to page 1 when filter results change
    currentPage.set(1);
    // Save state after clearing filters
    saveStateToStorage();
  },

  // Data management actions
  async clearAllData(): Promise<void> {
    try {
      await databaseService.clearData();
      filterWorkerService.clearData();
      
      // Reset all atoms
      dataType.set('none');
      lineCount.set(0);
      csvHeaders.set([]);
      hasHeaders.set(true);
      delimiter.set(',');
      fileId.set(null);
      fileName.set(null);
      processingStatus.set('idle');
      processingProgress.set(0);
      processingError.set(null);
      activeFilters.set({});
      filterResults.set({});
      isFiltering.set(false);
      lastFilterTime.set(0);
      currentPage.set(1);
      
      // Clear stored state
      clearStoredState();
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to clear data';
      processingError.set(errorMessage);
      throw error;
    }
  },

  // UI actions
  openModal(): void {
    isModalOpen.set(true);
  },

  closeModal(): void {
    isModalOpen.set(false);
    selectedFilter.set(null);
  },

  selectFilter(filterId: string | null): void {
    selectedFilter.set(filterId);
  },

  setFocus(elementId: string | null): void {
    focusedElement.set(elementId);
  },

  setPage(page: number): void {
    currentPage.set(page);
  },

  // CSV specific actions
  async setHasHeaders(hasHeadersValue: boolean): Promise<void> {
    const currentDataType = dataType.get();
    const currentFileId = fileId.get();
    
    if (currentDataType !== 'csv' || !currentFileId) {
      hasHeaders.set(hasHeadersValue);
      saveStateToStorage();
      return;
    }
    
    try {
      processingStatus.set('parsing');
      processingProgress.set(0);
      
      // Get the original lines from IndexedDB to re-parse
      const originalLines = await this.getOriginalCSVLines();
      if (originalLines.length === 0) {
        hasHeaders.set(hasHeadersValue);
        saveStateToStorage();
        processingStatus.set('complete');
        return;
      }
      
      processingProgress.set(30);
      
      // Re-parse with new header setting
      const { csvData, headers, delimiter: newDelimiter } = fileParserService.reParseCSV(originalLines, hasHeadersValue);
      
      processingProgress.set(60);
      
      // Clear existing CSV data
      await databaseService.clearCSVData();
      
      // Store re-parsed data
      await databaseService.storeCSVLines(currentFileId, csvData, headers);
      
      processingProgress.set(80);
      
      // Update state
      hasHeaders.set(hasHeadersValue);
      csvHeaders.set(headers);
      lineCount.set(csvData.length);
      delimiter.set(newDelimiter);
      
      // Clear existing filters and results since line numbers may have changed
      activeFilters.set({});
      filterResults.set({});
      currentPage.set(1);
      
      // Reinitialize worker with new data
      if (filterWorkerService.isReady()) {
        const workerData = await databaseService.getAllCSVLinesForFiltering();
        await filterWorkerService.setData(workerData, 'csv');
      }
      
      processingProgress.set(100);
      processingStatus.set('complete');
      
      // Save updated state
      saveStateToStorage();
      
    } catch (error) {
      console.error('Failed to update header setting:', error);
      processingError.set('Failed to update header setting');
      processingStatus.set('error');
    }
  },
  
  async getOriginalCSVLines(): Promise<string[]> {
    const currentFileId = fileId.get();
    if (!currentFileId) return [];
    
    return await databaseService.getOriginalLines(currentFileId);
  },

  setDelimiter(delimiterValue: string): void {
    delimiter.set(delimiterValue);
  },

  // Utility actions
  getState(): LineFilterState {
    return {
      data: {
        fileId: fileId.get(),
        fileName: fileName.get(),
        dataType: dataType.get(),
        lineCount: lineCount.get(),
        csvHeaders: csvHeaders.get(),
        hasHeaders: hasHeaders.get(),
        delimiter: delimiter.get()
      },
      processing: {
        status: processingStatus.get(),
        progress: processingProgress.get(),
        error: processingError.get()
      },
      filters: {
        active: Object.keys(activeFilters.get()),
        results: Object.values(filterResults.get()),
        isFiltering: isFiltering.get(),
        lastFilterTime: lastFilterTime.get()
      },
      ui: {
        isModalOpen: isModalOpen.get(),
        selectedFilter: selectedFilter.get(),
        currentPage: currentPage.get(),
        pageSize: pageSize.get(),
        focusedElement: focusedElement.get()
      }
    };
  }
};

// Persistence utilities
const STORAGE_KEY = 'lineFilterState';

interface PersistedState {
  fileId: string;
  fileName: string;
  dataType: DataType;
  lineCount: number;
  csvHeaders: string[];
  hasHeaders: boolean;
  delimiter: string;
  activeFilters: Record<string, TextFilter | CSVFilter>;
  timestamp: number;
}

const saveStateToStorage = (): void => {
  try {
    const state: PersistedState = {
      fileId: fileId.get() || '',
      fileName: fileName.get() || '',
      dataType: dataType.get(),
      lineCount: lineCount.get(),
      csvHeaders: csvHeaders.get(),
      hasHeaders: hasHeaders.get(),
      delimiter: delimiter.get(),
      activeFilters: activeFilters.get(),
      timestamp: Date.now()
    };
    
    // Only save if we have actual data
    if (state.dataType !== 'none' && state.fileId) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  } catch (error) {
    console.warn('Failed to save state to localStorage:', error);
  }
};

const loadStateFromStorage = async (): Promise<boolean> => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return false;
    
    const state: PersistedState = JSON.parse(stored);
    
    // Check if data is not too old (max 24 hours)
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours in ms
    if (Date.now() - state.timestamp > maxAge) {
      localStorage.removeItem(STORAGE_KEY);
      return false;
    }
    
    // Check if the data still exists in IndexedDB
    const hasStoredData = await databaseService.hasData(state.fileId);
    if (!hasStoredData) {
      localStorage.removeItem(STORAGE_KEY);
      return false;
    }
    
    // Restore state
    fileId.set(state.fileId);
    fileName.set(state.fileName);
    dataType.set(state.dataType);
    lineCount.set(state.lineCount);
    csvHeaders.set(state.csvHeaders);
    hasHeaders.set(state.hasHeaders);
    delimiter.set(state.delimiter);
    activeFilters.set(state.activeFilters);
    
    // Initialize worker with restored data
    if (!filterWorkerService.isReady()) {
      await filterWorkerService.initialize();
    }
    
    let workerData: (Line | CSVLine)[];
    if (state.dataType === 'csv') {
      workerData = await databaseService.getAllCSVLinesForFiltering();
    } else {
      workerData = await databaseService.getAllTextLinesForFiltering();
    }
    
    await filterWorkerService.setData(workerData, state.dataType);
    
    // Re-apply all active filters
    const activeFilterList = Object.values(state.activeFilters).filter(f => f.isActive);
    for (const filter of activeFilterList) {
      try {
        await lineFilterActions.applyFilter(filter.id);
      } catch (error) {
        console.warn('Failed to restore filter:', filter.id, error);
      }
    }
    
    return true;
  } catch (error) {
    console.warn('Failed to restore state from localStorage:', error);
    localStorage.removeItem(STORAGE_KEY);
    return false;
  }
};

const clearStoredState = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear stored state:', error);
  }
};

// Initialize store
export const initializeLineFilterStore = async (): Promise<void> => {
  try {
    await filterWorkerService.initialize();
    
    // Try to restore previous state
    const restored = await loadStateFromStorage();
    if (restored) {
      console.log('Restored previous line filter session');
    }
  } catch (error) {
    console.error('Failed to initialize line filter store:', error);
    processingError.set('Failed to initialize filtering system');
  }
};