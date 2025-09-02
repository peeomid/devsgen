# Beautifier Unification Plan

## Goal (Brief)
Use vanilla JavaScript + Web Worker for the Beautify tool. All formatting goes through the unified `beautify()` → `BracketFormatterService` path, keeping the UI non‑blocking and lightweight (no React on this page).

## High‑Level Flow (Brief)
- Static HTML → Vanilla Client Script → Worker Service → Web Worker → `beautify()` → `BracketFormatterService` → Result back to UI

## Files To Create/Modify (Brief)
- `src/pages/tools/beautify/index.astro`: Replace React component with static markup; load client script.
- `src/pages/tools/beautify/beautify.client.ts` (new): Vanilla controller wiring UI ↔ Worker Service.
- `src/services/BeautifyWorkerService.ts` (new): Lazy singleton worker wrapper with progress + cancel.
- Keep: `src/workers/beautifyWorker.ts` (already calls `beautify()`), `src/lib/beautify/beautify.ts` (uses `BracketFormatterService`).

---

## Details (Concise)

### 1) `src/services/BeautifyWorkerService.ts`
- ensureWorker(): Worker
  - Lazy create: `new Worker(new URL('../workers/beautifyWorker.ts', import.meta.url), { type: 'module' })` (client‑only).
- format(text: string, options: BeautifyOptions, onProgress?: (p: { processed: number; total: number }) => void): Promise<BeautifyResult>
  - Generate `id`, `postMessage({ id, text, options })`, listen for matching `progress`/`result`/`error` and resolve with `{ output, diagnostics, timeMs }`.
- cancel(id: string): void
  - `postMessage({ type: 'cancel', id })`.
- prewarm(): void
  - Optionally call `ensureWorker()` on idle.
- dispose(): void
  - Terminate worker, remove listeners.

Notes: Use a singleton; guard with `typeof window !== 'undefined'`; clean up on HMR/unload.

### 2) `src/pages/tools/beautify/index.astro`
- Replace React import with static form:
  - Inputs: `#input` (textarea), `#indent` (number), `#useTabs` (checkbox), `#formatBtn` (button).
  - UI: `#detectedBadge`, `#progressBar` + `#progressLabel`, `#output` (pre/code), optional diagnostics area.
- Load client script:
  - `<script type="module" src={Astro.resolve('./beautify.client.ts')}></script>`

### 3) `src/pages/tools/beautify/beautify.client.ts`
- initBeautifyUI(): void
  - On DOMContentLoaded: cache DOM refs, hook events, `BeautifyWorkerService.prewarm()`.
- readOptions(input: string): BeautifyOptions
  - Compute `detected = detectType(input)` and `mode = suggestModeFromDetection(detected)` from `src/lib/beautify/beautify.ts`.
  - Return full options with defaults: `{ mode, indent, useTabs, newlineAfterComma: true, keepComments: true, conservative: false }`.
- handleFormatClick(): Promise<void>
  - Cancel previous request (if any), read input + options, update detected badge, call `format(input, options, renderProgress)`, then `renderResult(result)`.
- renderProgress(p): void
  - Update progress bar/label from `{ processed, total }`.
- renderResult(result: BeautifyResult): void
  - Render `result.output`, show `result.diagnostics` (warnings/unbalanced), time; clear progress.
- cleanup(): void
  - On unload, call `BeautifyWorkerService.dispose()`.

### 4) Data Path (Precise)
- Send: Client → `BeautifyWorkerService.format(text, options)` → worker `postMessage({ id, text, options })`.
- Process: Worker → `beautify(text, options)` → `BracketFormatterService.format(...)` → adds diagnostics, top‑level spacing, trailing newline.
- Return: Worker → `progress` messages, then `result: BeautifyResult` → Service resolves → Client renders.

### 5) Required Changes
- Remove React beautifier usage on this page; use static HTML + `beautify.client.ts`.
- Implement `BeautifyWorkerService.ts` with lazy singleton and cancel.
- Wire detection for UI badge only; always format via worker.
- Provide complete `BeautifyOptions` (not just indent/tabs) for consistency.

### 6) Benefits
- Non‑blocking formatting via Web Worker.
- Unified logic shared with tests (`beautify()` → `BracketFormatterService`).
- Smaller, simpler page (no React bundle/hydration).
