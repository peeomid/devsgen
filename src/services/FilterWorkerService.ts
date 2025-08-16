import type { FilterResult } from '../types/filters';
import type { Line, CSVLine } from '../types/database';

export interface FilterWorkerOptions {
  filterId: string;
  pattern: string;
  patterns?: string[]; // Add patterns array for OR logic
  filterType: 'include' | 'exclude';
  caseSensitive: boolean;
  useRegex: boolean;
  columnIndex?: number;
  scope?: 'all' | 'column';
}

export interface FilterWorkerCallbacks {
  onProgress?: (filterId: string, progress: number, processedLines: number, totalLines: number) => void;
  onComplete?: (result: FilterResult) => void;
  onError?: (filterId: string, error: string) => void;
}

export class FilterWorkerService {
  private worker: Worker | null = null;
  private isInitialized = false;
  private callbacks: FilterWorkerCallbacks = {};
  private currentData: (Line | CSVLine)[] | null = null;
  private currentDataType: 'text' | 'csv' | null = null;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      this.worker = new Worker('/filter.worker.js');
      this.setupWorkerListeners();
      
      // Wait for worker ready message
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Worker initialization timeout'));
        }, 5000);

        const handleMessage = (e: MessageEvent) => {
          if (e.data.type === 'ready') {
            clearTimeout(timeout);
            this.worker?.removeEventListener('message', handleMessage);
            resolve();
          }
        };

        this.worker?.addEventListener('message', handleMessage);
      });

      this.isInitialized = true;
    } catch (error) {
      throw new Error(`Failed to initialize worker: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async setData(data: (Line | CSVLine)[], dataType: 'text' | 'csv'): Promise<void> {
    if (!this.worker || !this.isInitialized) {
      throw new Error('Worker not initialized');
    }

    this.currentData = data;
    this.currentDataType = dataType;

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Set data timeout'));
      }, 10000);

      const handleMessage = (e: MessageEvent) => {
        if (e.data.type === 'dataSet') {
          clearTimeout(timeout);
          this.worker?.removeEventListener('message', handleMessage);
          if (e.data.payload.success) {
            resolve();
          } else {
            reject(new Error('Failed to set data in worker'));
          }
        } else if (e.data.type === 'error') {
          clearTimeout(timeout);
          this.worker?.removeEventListener('message', handleMessage);
          reject(new Error(e.data.payload.error));
        }
      };

      this.worker?.addEventListener('message', handleMessage);
      this.worker?.postMessage({
        type: 'setData',
        payload: { data, dataType }
      });
    });
  }

  async filter(options: FilterWorkerOptions, callbacks: FilterWorkerCallbacks = {}): Promise<FilterResult> {
    if (!this.worker || !this.isInitialized) {
      throw new Error('Worker not initialized');
    }

    if (!this.currentData) {
      throw new Error('No data loaded in worker');
    }

    this.callbacks = callbacks;

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Filter operation timeout'));
      }, 30000); // 30 second timeout for large files

      const handleMessage = (e: MessageEvent) => {
        const { type, payload } = e.data;

        switch (type) {
          case 'progress':
            if (payload.filterId === options.filterId && callbacks.onProgress) {
              callbacks.onProgress(
                payload.filterId,
                payload.progress,
                payload.processedLines,
                payload.totalLines
              );
            }
            break;

          case 'complete':
            if (payload.filterId === options.filterId) {
              clearTimeout(timeout);
              this.worker?.removeEventListener('message', handleMessage);
              const result: FilterResult = {
                filterId: payload.filterId,
                matchedLines: payload.matchedLines,
                totalMatches: payload.totalMatches,
                processingTime: payload.processingTime
              };
              if (callbacks.onComplete) {
                callbacks.onComplete(result);
              }
              resolve(result);
            }
            break;

          case 'error':
            clearTimeout(timeout);
            this.worker?.removeEventListener('message', handleMessage);
            const error = payload.error || 'Unknown worker error';
            if (callbacks.onError) {
              callbacks.onError(options.filterId, error);
            }
            reject(new Error(error));
            break;
        }
      };

      this.worker?.addEventListener('message', handleMessage);
      this.worker?.postMessage({
        type: 'filter',
        payload: options
      });
    });
  }

  clearData(): void {
    if (this.worker && this.isInitialized) {
      this.worker.postMessage({ type: 'clear' });
      this.currentData = null;
      this.currentDataType = null;
    }
  }

  terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.isInitialized = false;
      this.currentData = null;
      this.currentDataType = null;
      this.callbacks = {};
    }
  }

  private setupWorkerListeners(): void {
    if (!this.worker) return;

    this.worker.addEventListener('error', (error) => {
      console.error('Worker error:', error);
      if (this.callbacks.onError) {
        this.callbacks.onError('unknown', `Worker error: ${error.message}`);
      }
    });

    this.worker.addEventListener('messageerror', (error) => {
      console.error('Worker message error:', error);
      if (this.callbacks.onError) {
        this.callbacks.onError('unknown', 'Worker message error');
      }
    });
  }

  isReady(): boolean {
    return this.isInitialized && this.worker !== null;
  }

  hasData(): boolean {
    return this.currentData !== null;
  }

  getDataInfo(): { lineCount: number; dataType: 'text' | 'csv' | null } {
    return {
      lineCount: this.currentData ? this.currentData.length : 0,
      dataType: this.currentDataType
    };
  }
}

export const filterWorkerService = new FilterWorkerService();