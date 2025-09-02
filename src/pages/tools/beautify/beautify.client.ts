import { beautifyWorkerService } from '../../../services/BeautifyWorkerService.ts';
import { detectType, suggestModeFromDetection } from '../../../lib/beautify/beautify.ts';
import type { BeautifyOptions, BeautifyResult } from '../../../types/beautify.ts';

function $(id: string): HTMLElement {
  const el = document.getElementById(id);
  if (!el) throw new Error(`#${id} not found`);
  return el;
}

function readOptions(input: string): { options: BeautifyOptions; detected: string } {
  const indentInput = $('indent') as HTMLInputElement;
  const useTabsInput = $('useTabs') as HTMLInputElement;
  const detected = detectType(input);
  const mode = suggestModeFromDetection(detected as any);
  const indent = Math.max(0, parseInt(indentInput.value || '2', 10));
  const useTabs = !!useTabsInput.checked;

  const options: BeautifyOptions = {
    mode,
    indent,
    useTabs,
    newlineAfterComma: true,
    keepComments: true,
    conservative: false,
  };
  return { options, detected };
}

function renderProgress(processed: number, total: number) {
  const fill = $('progressFill') as HTMLDivElement;
  const label = $('progressLabel');
  const pct = total > 0 ? Math.floor((processed / total) * 100) : 0;
  fill.style.width = `${pct}%`;
  label.textContent = `${pct}%`;
}

function renderResult(result: BeautifyResult) {
  const out = $('output');
  const diag = $('diagnostics');
  out.textContent = result.output;
  const warnings = result.diagnostics?.warnings?.length ? result.diagnostics.warnings.join('\n') : 'none';
  const unbalanced = result.diagnostics?.unbalancedBrackets ? 'true' : 'false';
  diag.textContent = `timeMs: ${Math.round(result.timeMs)}\n` +
    `unbalancedBrackets: ${unbalanced}\n` +
    `warnings:\n${warnings}`;
  renderProgress(0, 1); // reset
}

function setDetectedBadge(detected: string) {
  const badge = $('detectedBadge');
  badge.textContent = detected;
}

async function handleFormatClick() {
  const input = ( $('input') as HTMLTextAreaElement ).value;
  const { options, detected } = readOptions(input);
  setDetectedBadge(detected);

  try {
    const result = await beautifyWorkerService.format(input, options, ({ processed, total }) => {
      renderProgress(processed, total);
    });
    renderResult(result);
  } catch (err) {
    const out = $('output');
    out.textContent = err instanceof Error ? `Error: ${err.message}` : String(err);
  }
}

function initBeautifyUI() {
  beautifyWorkerService.prewarm();
  const btn = $('formatBtn');
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    handleFormatClick();
  });
  
  // Auto-select all text when textarea is focused (for easy deletion)
  const input = $('input') as HTMLTextAreaElement;
  input.addEventListener('focus', () => {
    input.select();
  });
  
  // Sample text is now server-rendered in the HTML
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initBeautifyUI);
} else {
  initBeautifyUI();
}

window.addEventListener('beforeunload', () => beautifyWorkerService.dispose());

