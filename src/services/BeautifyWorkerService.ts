import type { BeautifyOptions, BeautifyResult, WorkerMessage, WorkerRequest, WorkerProgress, WorkerResult, WorkerError } from '../types/beautify.ts';

type ProgressCb = (p: { processed: number; total: number }) => void;

export class BeautifyWorkerService {
  private worker: Worker | null = null;
  private pending: Map<string, {
    resolve: (value: BeautifyResult) => void;
    reject: (reason?: any) => void;
    onProgress?: ProgressCb;
  }> = new Map();
  private currentId: string | null = null;
  private boundOnMessage: ((e: MessageEvent<WorkerMessage>) => void) | null = null;

  ensureWorker(): Worker {
    if (this.worker) return this.worker;
    if (typeof window === 'undefined') {
      throw new Error('BeautifyWorkerService: Worker can only be initialized in the browser');
    }
    // Module worker via URL so bundler (Vite/Astro) resolves correctly
    this.worker = new Worker(new URL('../workers/beautifyWorker.ts', import.meta.url), { type: 'module' });
    this.boundOnMessage = this.onMessage.bind(this);
    this.worker.addEventListener('message', this.boundOnMessage as EventListener);
    return this.worker;
  }

  prewarm(): void {
    try {
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(() => this.ensureWorker());
      } else {
        setTimeout(() => this.ensureWorker(), 0);
      }
    } catch { /* noop */ }
  }

  format(text: string, options: BeautifyOptions, onProgress?: ProgressCb): Promise<BeautifyResult> {
    const worker = this.ensureWorker();

    // Auto-cancel in-flight request
    if (this.currentId) {
      this.cancel(this.currentId);
    }

    const id = this.nextId();
    this.currentId = id;

    const req: WorkerRequest = { id, text, options };

    return new Promise<BeautifyResult>((resolve, reject) => {
      this.pending.set(id, { resolve, reject, onProgress });
      try {
        worker.postMessage(req);
      } catch (err) {
        this.pending.delete(id);
        this.currentId = null;
        reject(err);
      }
    });
  }

  cancel(id: string): void {
    if (!this.worker) return;
    try {
      this.worker.postMessage({ type: 'cancel', id });
    } catch { /* noop */ }
    const entry = this.pending.get(id);
    if (entry) {
      entry.reject(new Error('Cancelled'));
      this.pending.delete(id);
    }
    if (this.currentId === id) this.currentId = null;
  }

  cancelCurrent(): void {
    if (this.currentId) this.cancel(this.currentId);
  }

  dispose(): void {
    if (this.worker) {
      if (this.boundOnMessage) {
        this.worker.removeEventListener('message', this.boundOnMessage as EventListener);
      }
      this.worker.terminate();
      this.worker = null;
    }
    // Reject any pending promises
    for (const [id, entry] of this.pending.entries()) {
      entry.reject(new Error('Disposed'));
      this.pending.delete(id);
    }
    this.currentId = null;
  }

  private onMessage(e: MessageEvent<WorkerMessage>): void {
    const msg = e.data;
    if (!msg || typeof (msg as any).id !== 'string') return;
    const id = (msg as any).id as string;
    const entry = this.pending.get(id);
    if (!entry) return;

    if (msg.type === 'progress') {
      const p = msg as WorkerProgress;
      entry.onProgress?.({ processed: p.processed, total: p.total });
      return;
    }

    if (msg.type === 'result') {
      const r = msg as WorkerResult;
      this.pending.delete(id);
      if (this.currentId === id) this.currentId = null;
      entry.resolve(r.result);
      return;
    }

    if (msg.type === 'error') {
      const er = msg as WorkerError;
      this.pending.delete(id);
      if (this.currentId === id) this.currentId = null;
      entry.reject(new Error(er.error));
      return;
    }
  }

  private nextId(): string {
    return 'bwr_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
}

export const beautifyWorkerService = new BeautifyWorkerService();

