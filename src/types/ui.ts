export interface UIState {
  dataType: 'none' | 'text' | 'csv';
  isProcessing: boolean;
  progress: number;
  error: string | null;
  isModalOpen: boolean;
  selectedFilter: string | null;
}

export interface FileUploadState {
  isDragOver: boolean;
  isUploading: boolean;
  progress: number;
  error: string | null;
}

export interface FilterState {
  activeFilters: string[];
  results: FilterResult[];
  isFiltering: boolean;
  lastFilterTime: number;
}

export interface CSVState {
  headers: string[];
  hasHeaders: boolean;
  delimiter: string;
  selectedColumn: number | null;
}

export interface DisplayState {
  currentPage: number;
  pageSize: number;
  totalResults: number;
  visibleLines: number[];
  scrollPosition: number;
}

export interface KeyboardState {
  isCommandPaletteOpen: boolean;
  focusedElement: string | null;
  shortcuts: {
    [key: string]: () => void;
  };
}

export type DataType = 'none' | 'text' | 'csv';
export type ProcessingStatus = 'idle' | 'uploading' | 'parsing' | 'filtering' | 'complete' | 'error';