import type { 
  WorkerMessage, 
  WorkerSetJSONRequest, 
  WorkerFilterRequest,
  WorkerProgressMessage,
  WorkerCompleteMessage,
  WorkerErrorMessage,
  FilterSet,
  FilterResult
} from '../types/jsonViewer';

interface PendingRequest {
  resolve: (result: any) => void;
  reject: (error: Error) => void;
  timeout: NodeJS.Timeout;
}

export class JSONWorkerService {
  private static instance: JSONWorkerService;
  private worker: Worker | null = null;
  private pendingRequests = new Map<string, PendingRequest>();
  private isInitialized = false;
  private readonly WORKER_TIMEOUT = 30000; // 30 seconds

  static getInstance(): JSONWorkerService {
    if (!JSONWorkerService.instance) {
      JSONWorkerService.instance = new JSONWorkerService();
    }
    return JSONWorkerService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Create worker from public directory
      this.worker = new Worker('/json-filter.worker.js');
      this.setupWorkerMessageHandler();
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize JSON worker:', error);
      throw new Error('Web Worker not available');
    }
  }

  private setupWorkerMessageHandler(): void {
    if (!this.worker) return;

    this.worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
      const { type, payload } = event.data;

      switch (type) {
        case 'progress':
          this.handleProgress(payload as WorkerProgressMessage['payload']);
          break;
        case 'complete':
          this.handleComplete(payload as WorkerCompleteMessage['payload']);
          break;
        case 'error':
          this.handleError(payload as WorkerErrorMessage['payload']);
          break;
      }
    };

    this.worker.onerror = (error) => {
      console.error('Worker error:', error);
      this.rejectAllPending(new Error('Worker error occurred'));
    };
  }

  async setJSON(json: string, fileId: string): Promise<void> {
    if (!this.worker) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      const requestId = this.generateRequestId();
      
      const request: WorkerSetJSONRequest = {
        type: 'setJSON',
        data: { json, fileId }
      };

      this.addPendingRequest(requestId, resolve, reject);
      this.worker!.postMessage({ ...request, requestId });
    });
  }

  async filterJSON(filterSets: FilterSet[]): Promise<FilterResult> {
    if (!this.worker) {
      throw new Error('Worker not initialized');
    }

    return new Promise((resolve, reject) => {
      const requestId = this.generateRequestId();
      
      const request: WorkerFilterRequest = {
        type: 'filter',
        data: { filterSets, requestId }
      };

      this.addPendingRequest(requestId, resolve, reject);
      this.worker!.postMessage(request);
    });
  }

  async searchByValue(value: string): Promise<FilterResult> {
    if (!this.worker) {
      throw new Error('Worker not initialized');
    }

    return new Promise((resolve, reject) => {
      const requestId = this.generateRequestId();
      
      const request = {
        type: 'searchValue',
        data: { value, requestId }
      };

      this.addPendingRequest(requestId, resolve, reject);
      this.worker!.postMessage(request);
    });
  }

  async searchByPath(path: string): Promise<FilterResult> {
    if (!this.worker) {
      throw new Error('Worker not initialized');
    }

    return new Promise((resolve, reject) => {
      const requestId = this.generateRequestId();
      
      const request = {
        type: 'searchPath',
        data: { path, requestId }
      };

      this.addPendingRequest(requestId, resolve, reject);
      this.worker!.postMessage(request);
    });
  }

  async unifiedSearch(config: {
    query: string;
    type: 'both' | 'properties' | 'values';
    pathScope?: string;
  }): Promise<FilterResult> {
    if (!this.worker) {
      throw new Error('Worker not initialized');
    }

    return new Promise((resolve, reject) => {
      const requestId = this.generateRequestId();
      
      const request = {
        type: 'unifiedSearch',
        data: { 
          query: config.query,
          searchType: config.type,
          pathScope: config.pathScope,
          requestId 
        }
      };

      this.addPendingRequest(requestId, resolve, reject);
      this.worker!.postMessage(request);
    });
  }

  async clearJSON(): Promise<void> {
    if (!this.worker) return;

    return new Promise((resolve, reject) => {
      const requestId = this.generateRequestId();
      
      this.addPendingRequest(requestId, resolve, reject);
      this.worker!.postMessage({ 
        type: 'clear', 
        requestId 
      });
    });
  }

  terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    
    this.rejectAllPending(new Error('Worker terminated'));
    this.isInitialized = false;
  }

  private addPendingRequest(
    requestId: string, 
    resolve: (result: any) => void, 
    reject: (error: Error) => void
  ): void {
    const timeout = setTimeout(() => {
      this.pendingRequests.delete(requestId);
      reject(new Error(`Worker request timeout: ${requestId}`));
    }, this.WORKER_TIMEOUT);

    this.pendingRequests.set(requestId, {
      resolve,
      reject,
      timeout
    });
  }

  private handleProgress(payload: WorkerProgressMessage['payload']): void {
    // Progress can be handled by emitting events or updating stores
    // For now, we'll just log it
    console.debug(`Worker progress [${payload.requestId}]:`, payload);
  }

  private handleComplete(payload: WorkerCompleteMessage['payload']): void {
    const request = this.pendingRequests.get(payload.requestId);
    if (request) {
      clearTimeout(request.timeout);
      this.pendingRequests.delete(payload.requestId);
      request.resolve(payload);
    }
  }

  private handleError(payload: WorkerErrorMessage['payload']): void {
    const request = this.pendingRequests.get(payload.requestId);
    if (request) {
      clearTimeout(request.timeout);
      this.pendingRequests.delete(payload.requestId);
      request.reject(new Error(payload.error));
    }
  }

  private rejectAllPending(error: Error): void {
    for (const [requestId, request] of this.pendingRequests) {
      clearTimeout(request.timeout);
      request.reject(error);
    }
    this.pendingRequests.clear();
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public method to check if worker is available
  isAvailable(): boolean {
    return this.isInitialized && this.worker !== null;
  }

  // Method to get current load (number of pending requests)
  getCurrentLoad(): number {
    return this.pendingRequests.size;
  }
}