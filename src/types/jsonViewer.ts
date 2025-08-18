export interface JSONViewerData {
  fileId: string | null;
  fileName: string | null;
  originalJSON: string | null;
  parsedJSON: any | null;
  fileSize: number;
  storageLocation: 'memory' | 'opfs' | 'localStorage';
}

export interface JSONViewerState {
  data: JSONViewerData;
  display: {
    currentView: 'tree' | 'raw';
    expandedPaths: Set<string>;
    selectedPath: string | null;
    searchTerm: string;
  };
  processing: {
    status: 'idle' | 'loading' | 'processing' | 'ready' | 'error';
    progress: number;
    error: string | null;
  };
  filters: {
    active: FilterSet[];
    results: FilterResult | null;
    isFiltering: boolean;
    lastFilterTime: number;
  };
  ui: {
    isFilterDialogOpen: boolean;
    isDragover: boolean;
    clipboardStatus: 'idle' | 'copying' | 'copied';
    currentBreadcrumb: string[];
  };
}

export interface FilterSet {
  id: string;
  name: string;
  type: 'path' | 'value';
  values: string[];
  active: boolean;
  createdAt: number;
}

export interface FilterResult {
  filteredJSON: any;
  matchCount: number;
  matchedPaths: string[];
  processingTime: number;
}

export interface JSONTreeNode {
  key: string;
  value: any;
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';
  path: string;
  level: number;
  isExpanded: boolean;
  hasChildren: boolean;
  childCount?: number;
}

export interface WorkerMessage {
  type: 'setJSON' | 'filter' | 'searchValue' | 'searchPath' | 'clear' | 'progress' | 'complete' | 'error';
  payload: any;
}

export interface WorkerSetJSONRequest {
  type: 'setJSON';
  data: {
    json: string;
    fileId: string;
  };
}

export interface WorkerFilterRequest {
  type: 'filter';
  data: {
    filterSets: FilterSet[];
    requestId: string;
  };
}

export interface WorkerProgressMessage {
  type: 'progress';
  payload: {
    requestId: string;
    progress: number;
    stage: string;
  };
}

export interface WorkerCompleteMessage {
  type: 'complete';
  payload: FilterResult & {
    requestId: string;
  };
}

export interface WorkerErrorMessage {
  type: 'error';
  payload: {
    requestId: string;
    error: string;
  };
}