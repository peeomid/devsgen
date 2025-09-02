import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { BeautifyWorkerService } from '../../services/BeautifyWorkerService.ts';
import type { BeautifyOptions, WorkerRequest } from '../../types/beautify.ts';
import { beautify } from '../../lib/beautify/beautify.ts';

class MockWorker {
  listeners: Array<(e: MessageEvent<any>) => void> = [];
  terminated = false;

  addEventListener(_type: string, cb: any) {
    this.listeners.push(cb);
  }
  removeEventListener(_type: string, cb: any) {
    this.listeners = this.listeners.filter(l => l !== cb);
  }
  terminate() { this.terminated = true; }

  postMessage(data: any) {
    // Simulate worker behavior: on request, emit progress then result
    if (data && typeof data === 'object' && 'id' in data && 'text' in data) {
      const req = data as WorkerRequest;
      // progress
      setTimeout(() => {
        this.emit({ data: { id: req.id, type: 'progress', processed: 1, total: 3 } });
      }, 0);
      // result
      setTimeout(() => {
        const result = beautify(req.text, req.options);
        this.emit({ data: { id: req.id, type: 'result', result } });
      }, 1);
      return;
    }
    // handle cancel messages: do nothing, the service will reject pending promise immediately
  }

  private emit(e: any) {
    for (const l of this.listeners) l(e);
  }
}

describe('BeautifyWorkerService', () => {
  const defaultOptions: BeautifyOptions = {
    mode: 'structure',
    indent: 2,
    useTabs: false,
    newlineAfterComma: true,
    keepComments: true,
    conservative: false,
  };

  let originalWorker: any;

  beforeEach(() => {
    originalWorker = (globalThis as any).Worker;
    (globalThis as any).Worker = MockWorker as any;
  });

  afterEach(() => {
    (globalThis as any).Worker = originalWorker;
  });

  test('formats via worker and returns result', async () => {
    const svc = new BeautifyWorkerService();
    const input = '{"key":"value","other":"data"}';

    let progressSeen = 0;
    const result = await svc.format(input, defaultOptions, ({ processed, total }) => {
      progressSeen += processed;
      expect(total).toBeGreaterThan(0);
    });

    expect(progressSeen).toBeGreaterThan(0);
    expect(result.output).toContain('\n  "key": "value"');
    expect(result.diagnostics.warnings).toBeDefined();
    svc.dispose();
  });

  test('auto-cancels previous request when a new one starts', async () => {
    const svc = new BeautifyWorkerService();
    const input1 = '{"a":1}';
    const input2 = '{"b":2}';

    const p1 = svc.format(input1, defaultOptions).then(
      () => ({ ok: true }),
      (e) => ({ ok: false, err: e })
    );
    const p2 = svc.format(input2, defaultOptions);

    const r1 = await p1;
    const r2 = await p2;

    expect(r1.ok).toBe(false);
    expect((r1 as any).err).toBeInstanceOf(Error);
    expect(r2.output).toContain('"b": 2');
    svc.dispose();
  });

  test('cancelCurrent rejects the in-flight promise', async () => {
    const svc = new BeautifyWorkerService();
    const input = '{"x":1}';
    const p = svc.format(input, defaultOptions).then(
      () => ({ ok: true }),
      (e) => ({ ok: false, err: e })
    );
    svc.cancelCurrent();
    const r = await p;
    expect(r.ok).toBe(false);
    expect((r as any).err).toBeInstanceOf(Error);
    svc.dispose();
  });

  // Var_dump exact layout verification removed due to reverting php var_dump post-processing
});
