import { atom, computed, map } from 'nanostores';
import type { 
  JSONViewerState, 
  JSONViewerData, 
  FilterSet, 
  FilterResult,
  JSONTreeNode
} from '../types/jsonViewer';
import { OPFSStorageService } from '../services/OPFSStorageService';
import { JSONWorkerService } from '../services/JSONWorkerService';
import { JSONValidator } from '../utils/jsonValidator';

// Search management with debouncing and abort controller
class SearchManager {
  private searchTimeout: NodeJS.Timeout | null = null;
  private abortController: AbortController | null = null;
  private readonly DEBOUNCE_DELAY = 300; // ms
  
  async debouncedSearch(
    searchFn: () => Promise<void>, 
    delay: number = this.DEBOUNCE_DELAY
  ): Promise<void> {
    // Cancel previous search
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    if (this.abortController) {
      this.abortController.abort();
    }
    
    return new Promise((resolve, reject) => {
      this.searchTimeout = setTimeout(async () => {
        try {
          this.abortController = new AbortController();
          await searchFn();
          resolve();
        } catch (error) {
          if (error instanceof Error && error.name !== 'AbortError') {
            reject(error);
          }
        }
      }, delay);
    });
  }
  
  cancelSearch(): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
      this.searchTimeout = null;
    }
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }
}

// Batch state updates to reduce re-renders
function batchUpdate(updateFn: () => void): void {
  // Use requestAnimationFrame to batch updates
  requestAnimationFrame(() => {
    updateFn();
  });
}

const searchManager = new SearchManager();

// Core data atoms
export const originalJSON = atom<string | null>(null);
export const parsedJSON = atom<any | null>(null);
export const fileId = atom<string | null>(null);
export const fileName = atom<string | null>(null);
export const fileSize = atom<number>(0);
export const storageLocation = atom<'memory' | 'opfs' | 'localStorage'>('memory');

// Display atoms
export const currentView = atom<'tree' | 'raw'>('tree');
export const expandedPaths = atom<Set<string>>(new Set());
export const selectedPath = atom<string | null>(null);

// Unified search atoms
export const searchQuery = atom<string>('');
export const searchType = atom<'both' | 'properties' | 'values'>('both');
export const searchPath = atom<string>('');

// Legacy search atom (deprecated - keeping for backward compatibility)
export const searchTerm = atom<string>('');

// Processing atoms
export const processingStatus = atom<'idle' | 'loading' | 'processing' | 'ready' | 'error'>('idle');
export const processingProgress = atom<number>(0);
export const processingError = atom<string | null>(null);

// Filter atoms
export const activeFilterSets = map<Record<string, FilterSet>>({});
export const filterResults = atom<FilterResult | null>(null);
export const isFiltering = atom<boolean>(false);
export const lastFilterTime = atom<number>(0);

// UI atoms
export const isFilterDialogOpen = atom<boolean>(false);
export const isDragover = atom<boolean>(false);
export const clipboardStatus = atom<'idle' | 'copying' | 'copied'>('idle');
export const currentBreadcrumb = atom<string[]>([]);
export const validationFeedback = atom<{
  message: string;
  type: 'success' | 'warning' | 'error';
  timestamp: number;
} | null>(null);

// Services
const storageService = OPFSStorageService.getInstance();
const workerService = JSONWorkerService.getInstance();

// Computed values
export const hasJSON = computed([originalJSON, parsedJSON], (original, parsed) => {
  return original !== null && parsed !== null;
});

export const canFilter = computed([hasJSON, isFiltering], (hasData, filtering) => {
  return hasData && !filtering;
});

export const activeFilterCount = computed(activeFilterSets, (filterSets) => {
  return Object.values(filterSets).filter(fs => fs.active).length;
});

export const isProcessing = computed(processingStatus, (status) => {
  return status === 'loading' || status === 'processing';
});

export const displayJSON = computed([parsedJSON, filterResults], (parsed, filtered) => {
  // OPTIMIZED: Don't return full JSON, let components handle filtering
  return parsed;
});

// Store actions
export const jsonViewerActions = {
  // Memory management
  clearMemory(): void {
    // Cancel any ongoing searches
    searchManager.cancelSearch();
    
    // Clear large objects explicitly
    batchUpdate(() => {
      originalJSON.set(null);
      parsedJSON.set(null);
      filterResults.set(null);
      expandedPaths.set(new Set());
      selectedPath.set(null);
      searchQuery.set('');
      searchPath.set('');
    });
    
    // Clear worker memory
    if (workerService) {
      workerService.clearJSON();
    }
    
    // Force garbage collection hint (if available)
    if (typeof window !== 'undefined' && (window as any).gc) {
      (window as any).gc();
    }
  },
  
  // OPTIMIZED: Memory-aware JSON loading
  async loadJSONFromFile(file: File): Promise<void> {
    try {
      // Clear previous data before loading new
      this.clearMemory();
      
      processingStatus.set('loading');
      processingProgress.set(0);
      processingError.set(null);

      // Read file content
      const content = await file.text();
      processingProgress.set(30);

      // Validate JSON with comprehensive error handling
      const validationResult = JSONValidator.validate(content);
      if (!validationResult.isValid) {
        const errorMessage = validationResult.suggestion 
          ? `${validationResult.error}: ${validationResult.suggestion}`
          : validationResult.error || 'Invalid JSON format';
        throw new Error(errorMessage);
      }
      
      const parsed = validationResult.parsed;
      
      // If auto-fixes were applied, show feedback to user
      if (validationResult.suggestion && validationResult.suggestion.includes('Fixed automatically')) {
        validationFeedback.set({
          message: validationResult.suggestion,
          type: 'success',
          timestamp: Date.now()
        });
      }

      processingProgress.set(50);

      // Generate file ID and store
      const id = generateFileId();
      const storage = await storageService.saveJSON(id, file.name, content);
      
      processingProgress.set(80);

      // Initialize worker
      await workerService.initialize();
      await workerService.setJSON(content, id);

      // Update state
      originalJSON.set(content);
      parsedJSON.set(parsed);
      fileId.set(id);
      fileName.set(file.name);
      fileSize.set(file.size);
      storageLocation.set(storage);
      
      // Auto-expand JSON tree by default
      jsonViewerActions.expandAll();
      
      processingProgress.set(100);
      processingStatus.set('ready');
      
      // Save state
      saveStateToStorage();

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load JSON file';
      processingError.set(errorMessage);
      processingStatus.set('error');
      throw error;
    }
  },

  async loadJSONFromText(text: string): Promise<void> {
    try {
      // Clear previous data before loading new
      this.clearMemory();
      
      processingStatus.set('processing');
      processingProgress.set(0);
      processingError.set(null);

      // Validate JSON with comprehensive error handling
      const validationResult = JSONValidator.validate(text);
      if (!validationResult.isValid) {
        const errorMessage = validationResult.suggestion 
          ? `${validationResult.error}: ${validationResult.suggestion}`
          : validationResult.error || 'Invalid JSON format';
        throw new Error(errorMessage);
      }
      
      const parsed = validationResult.parsed;
      
      // If auto-fixes were applied, show feedback to user
      if (validationResult.suggestion && validationResult.suggestion.includes('Fixed automatically')) {
        validationFeedback.set({
          message: validationResult.suggestion,
          type: 'success',
          timestamp: Date.now()
        });
      }

      processingProgress.set(40);

      // Generate file ID and store
      const id = generateFileId();
      const generatedFileName = `pasted-${new Date().toISOString().slice(0, 10)}.json`;
      const storage = await storageService.saveJSON(id, generatedFileName, text);
      
      processingProgress.set(70);

      // Initialize worker
      await workerService.initialize();
      await workerService.setJSON(text, id);

      // Update state
      originalJSON.set(text);
      parsedJSON.set(parsed);
      fileId.set(id);
      fileName.set(generatedFileName);
      fileSize.set(new Blob([text]).size);
      storageLocation.set(storage);
      
      // Auto-expand JSON tree by default
      jsonViewerActions.expandAll();
      
      processingProgress.set(100);
      processingStatus.set('ready');
      
      // Save state
      saveStateToStorage();

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process JSON text';
      processingError.set(errorMessage);
      processingStatus.set('error');
      throw error;
    }
  },

  // Display actions
  setView(view: 'tree' | 'raw'): void {
    currentView.set(view);
    saveStateToStorage();
  },

  togglePath(path: string): void {
    const expanded = expandedPaths.get();
    const newExpanded = new Set(expanded);
    
    if (expanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    
    expandedPaths.set(newExpanded);
  },

  expandAll(): void {
    const json = parsedJSON.get();
    if (!json) return;

    const allPaths = new Set<string>();
    const traverse = (obj: any, path: string = '') => {
      if (typeof obj === 'object' && obj !== null) {
        if (Array.isArray(obj)) {
          allPaths.add(path);
          obj.forEach((item, index) => {
            traverse(item, path ? `${path}[${index}]` : `[${index}]`);
          });
        } else {
          allPaths.add(path);
          Object.keys(obj).forEach(key => {
            const newPath = path ? `${path}.${key}` : key;
            traverse(obj[key], newPath);
          });
        }
      }
    };

    traverse(json);
    expandedPaths.set(allPaths);
  },

  collapseAll(): void {
    expandedPaths.set(new Set());
  },

  selectPath(path: string | null): void {
    selectedPath.set(path);
    
    if (path) {
      // Update breadcrumb
      const segments = path.split(/[.\[\]]/).filter(Boolean);
      currentBreadcrumb.set(segments);
    } else {
      currentBreadcrumb.set([]);
    }
  },

  setSearchTerm(term: string): void {
    searchTerm.set(term);
  },

  // New unified search actions
  setSearchQuery(query: string): void {
    searchQuery.set(query);
  },

  setSearchType(type: 'both' | 'properties' | 'values'): void {
    searchType.set(type);
  },

  setSearchPath(path: string): void {
    searchPath.set(path);
  },

  clearSearchPath(): void {
    searchPath.set('');
  },

  async unifiedSearch(): Promise<void> {
    return searchManager.debouncedSearch(async () => {
      const query = searchQuery.get().trim();
      const type = searchType.get();
      const pathScope = searchPath.get().trim();

      if (!parsedJSON.get() || !query) return;
      
      try {
        // OPTIMIZED: Batch state updates to reduce re-renders
        batchUpdate(() => {
          processingStatus.set('processing');
          processingError.set(null);
          isFiltering.set(true);
        });
        
        const searchConfig = {
          query,
          type,
          pathScope: pathScope || undefined,
          maxResults: 1000 // Add result limit
        };
        
        const result = await workerService.unifiedSearch(searchConfig);
        
        // OPTIMIZED: Batch completion updates
        batchUpdate(() => {
          filterResults.set(result);
          lastFilterTime.set(Date.now());
          processingStatus.set('ready');
          isFiltering.set(false);
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Search failed';
        batchUpdate(() => {
          processingError.set(errorMessage);
          processingStatus.set('error');
          isFiltering.set(false);
        });
      }
    });
  },
  
  cancelSearch(): void {
    searchManager.cancelSearch();
    batchUpdate(() => {
      processingStatus.set('ready');
      isFiltering.set(false);
    });
  },

  async searchByValue(value: string): Promise<void> {
    if (!parsedJSON.get() || !value.trim()) return;
    
    try {
      batchUpdate(() => {
        processingStatus.set('processing');
        processingError.set(null);
        isFiltering.set(true);
      });
      
      const result = await workerService.searchByValue(value.trim());
      
      batchUpdate(() => {
        filterResults.set(result);
        lastFilterTime.set(Date.now());
        processingStatus.set('ready');
        isFiltering.set(false);
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Value search failed';
      batchUpdate(() => {
        processingError.set(errorMessage);
        processingStatus.set('error');
        isFiltering.set(false);
      });
    }
  },

  async searchByPath(path: string): Promise<void> {
    if (!parsedJSON.get() || !path.trim()) return;
    
    try {
      processingStatus.set('processing');
      processingError.set(null);
      isFiltering.set(true);
      const result = await workerService.searchByPath(path.trim());
      filterResults.set(result);
      lastFilterTime.set(Date.now());
      processingStatus.set('ready');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Path search failed';
      processingError.set(errorMessage);
      processingStatus.set('error');
    } finally {
      isFiltering.set(false);
    }
  },

  // Filter actions
  async addFilterSet(filterSet: Omit<FilterSet, 'id' | 'createdAt'>): Promise<string> {
    const id = generateFilterId();
    const newFilterSet: FilterSet = {
      ...filterSet,
      id,
      createdAt: Date.now()
    };

    const current = activeFilterSets.get();
    activeFilterSets.set({
      ...current,
      [id]: newFilterSet
    });

    // Filters are applied manually - no auto-apply

    saveStateToStorage();
    return id;
  },

  removeFilterSet(filterId: string): void {
    const current = activeFilterSets.get();
    const newFilters = { ...current };
    delete newFilters[filterId];
    activeFilterSets.set(newFilters);

    // Manual filter application required - no auto-apply
    saveStateToStorage();
  },

  toggleFilterSet(filterId: string): void {
    const current = activeFilterSets.get();
    const filterSet = current[filterId];
    
    if (filterSet) {
      activeFilterSets.set({
        ...current,
        [filterId]: { ...filterSet, active: !filterSet.active }
      });

      // Manual filter application required - no auto-apply
      saveStateToStorage();
    }
  },

  async applyFilters(): Promise<void> {
    const filterSets = Object.values(activeFilterSets.get()).filter(fs => fs.active);
    
    if (filterSets.length === 0) {
      filterResults.set(null);
      return;
    }

    try {
      isFiltering.set(true);
      const result = await workerService.filterJSON(filterSets);
      filterResults.set(result);
      lastFilterTime.set(Date.now());
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Filter operation failed';
      processingError.set(errorMessage);
    } finally {
      isFiltering.set(false);
    }
  },

  clearFilters(): void {
    activeFilterSets.set({});
    filterResults.set(null);
    saveStateToStorage();
  },

  // UI actions
  openFilterDialog(): void {
    isFilterDialogOpen.set(true);
  },

  closeFilterDialog(): void {
    isFilterDialogOpen.set(false);
  },

  setDragover(dragover: boolean): void {
    isDragover.set(dragover);
  },

  dismissValidationFeedback(): void {
    validationFeedback.set(null);
  },

  async copyToClipboard(content: string): Promise<void> {
    try {
      clipboardStatus.set('copying');
      await navigator.clipboard.writeText(content);
      clipboardStatus.set('copied');
      
      // Reset status after 2 seconds
      setTimeout(() => {
        clipboardStatus.set('idle');
      }, 2000);
    } catch (error) {
      clipboardStatus.set('idle');
      throw new Error('Failed to copy to clipboard');
    }
  },

  // OPTIMIZED: Data management with proper cleanup
  async clearJSON(): Promise<void> {
    const currentFileId = fileId.get();
    
    // Cancel ongoing operations
    searchManager.cancelSearch();
    
    if (currentFileId) {
      await storageService.deleteJSON(currentFileId);
    }
    
    await workerService.clearJSON();

    // Batch all state resets to reduce re-renders
    batchUpdate(() => {
      originalJSON.set(null);
      parsedJSON.set(null);
      fileId.set(null);
      fileName.set(null);
      fileSize.set(0);
      storageLocation.set('memory');
      currentView.set('tree');
      expandedPaths.set(new Set());
      selectedPath.set(null);
      searchTerm.set('');
      searchQuery.set('');
      searchType.set('both');
      searchPath.set('');
      processingStatus.set('idle');
      processingProgress.set(0);
      processingError.set(null);
      activeFilterSets.set({});
      filterResults.set(null);
      isFiltering.set(false);
      lastFilterTime.set(0);
      isFilterDialogOpen.set(false);
      isDragover.set(false);
      clipboardStatus.set('idle');
      currentBreadcrumb.set([]);
      validationFeedback.set(null);
    });

    clearStoredState();
    
    // Force garbage collection
    if (typeof window !== 'undefined' && (window as any).gc) {
      (window as any).gc();
    }
  },

  // Utility actions
  getState(): JSONViewerState {
    return {
      data: {
        fileId: fileId.get(),
        fileName: fileName.get(),
        originalJSON: originalJSON.get(),
        parsedJSON: parsedJSON.get(),
        fileSize: fileSize.get(),
        storageLocation: storageLocation.get()
      },
      display: {
        currentView: currentView.get(),
        expandedPaths: expandedPaths.get(),
        selectedPath: selectedPath.get(),
        searchTerm: searchTerm.get()
      },
      processing: {
        status: processingStatus.get(),
        progress: processingProgress.get(),
        error: processingError.get()
      },
      filters: {
        active: Object.values(activeFilterSets.get()),
        results: filterResults.get(),
        isFiltering: isFiltering.get(),
        lastFilterTime: lastFilterTime.get()
      },
      ui: {
        isFilterDialogOpen: isFilterDialogOpen.get(),
        isDragover: isDragover.get(),
        clipboardStatus: clipboardStatus.get(),
        currentBreadcrumb: currentBreadcrumb.get()
      }
    };
  }
};

// Utility functions
function generateFileId(): string {
  return `json_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateFilterId(): string {
  return `filter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Persistence utilities
const STORAGE_KEY = 'jsonViewerState';

interface PersistedState {
  fileId: string;
  fileName: string;
  currentView: 'tree' | 'raw';
  expandedPaths: string[];
  activeFilterSets: Record<string, FilterSet>;
  timestamp: number;
}

const saveStateToStorage = (): void => {
  try {
    const state: PersistedState = {
      fileId: fileId.get() || '',
      fileName: fileName.get() || '',
      currentView: currentView.get(),
      expandedPaths: Array.from(expandedPaths.get()),
      activeFilterSets: activeFilterSets.get(),
      timestamp: Date.now()
    };
    
    // Only save if we have actual data
    if (state.fileId) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  } catch (error) {
    console.warn('Failed to save JSON viewer state:', error);
  }
};

const loadStateFromStorage = async (): Promise<boolean> => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return false;
    
    const state: PersistedState = JSON.parse(stored);
    
    // Check if data is not too old (max 24 hours)
    const maxAge = 24 * 60 * 60 * 1000;
    if (Date.now() - state.timestamp > maxAge) {
      localStorage.removeItem(STORAGE_KEY);
      return false;
    }
    
    // Try to load JSON data
    const content = await storageService.loadJSON(state.fileId);
    if (!content) {
      localStorage.removeItem(STORAGE_KEY);
      return false;
    }
    
    // Parse and restore JSON with comprehensive validation
    const validationResult = JSONValidator.validate(content);
    if (!validationResult.isValid) {
      console.warn('Stored JSON is invalid, clearing state:', validationResult.error);
      localStorage.removeItem(STORAGE_KEY);
      return false;
    }
    
    const parsed = validationResult.parsed;
    
    // Initialize worker
    await workerService.initialize();
    await workerService.setJSON(content, state.fileId);
    
    // Restore state
    originalJSON.set(content);
    parsedJSON.set(parsed);
    fileId.set(state.fileId);
    fileName.set(state.fileName);
    fileSize.set(new Blob([content]).size);
    currentView.set(state.currentView);
    expandedPaths.set(new Set(state.expandedPaths));
    activeFilterSets.set(state.activeFilterSets);
    
    // Note: Filters are restored but not auto-applied - user must manually execute
    
    processingStatus.set('ready');
    
    return true;
  } catch (error) {
    console.warn('Failed to restore JSON viewer state:', error);
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
export const initializeJSONViewerStore = async (): Promise<void> => {
  try {
    await storageService.initialize();
    await workerService.initialize();
    
    // Try to restore previous state
    const restored = await loadStateFromStorage();
    if (restored) {
      console.log('Restored previous JSON viewer session');
    }
  } catch (error) {
    console.error('Failed to initialize JSON viewer store:', error);
    processingError.set('Failed to initialize JSON viewer system');
  }
};