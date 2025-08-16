import type { FilterResult } from './filters';
import type { DataType, ProcessingStatus } from './ui';

export interface LineFilterData {
  fileId: string | null;
  fileName: string | null;
  dataType: DataType;
  lineCount: number;
  csvHeaders: string[];
  hasHeaders: boolean;
  delimiter: string;
}

export interface LineFilterState {
  data: LineFilterData;
  processing: {
    status: ProcessingStatus;
    progress: number;
    error: string | null;
  };
  filters: {
    active: string[];
    results: FilterResult[];
    isFiltering: boolean;
    lastFilterTime: number;
  };
  ui: {
    isModalOpen: boolean;
    selectedFilter: string | null;
    currentPage: number;
    pageSize: number;
    focusedElement: string | null;
  };
}

export interface WorkerMessage {
  type: 'filter' | 'progress' | 'complete' | 'error';
  payload: any;
}

export interface WorkerFilterRequest {
  type: 'filter';
  data: {
    filterId: string;
    pattern: string;
    filterType: 'include' | 'exclude';
    caseSensitive: boolean;
    useRegex: boolean;
    dataType: 'text' | 'csv';
    columnIndex?: number;
  };
}

export interface WorkerProgressMessage {
  type: 'progress';
  payload: {
    filterId: string;
    progress: number;
    processedLines: number;
  };
}

export interface WorkerCompleteMessage {
  type: 'complete';
  payload: FilterResult;
}

export interface WorkerErrorMessage {
  type: 'error';
  payload: {
    filterId: string;
    error: string;
  };
}