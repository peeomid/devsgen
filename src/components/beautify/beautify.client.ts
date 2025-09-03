import { beautifyWorkerService } from '../../services/BeautifyWorkerService.ts';
import { detectType, suggestModeFromDetection } from '../../lib/beautify/beautify.ts';
import type { BeautifyOptions, BeautifyResult } from '../../types/beautify.ts';

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
  const copyBtn = $('copyBtn');
  
  out.textContent = result.output;
  
  if (result.output.trim()) {
    copyBtn.style.display = 'flex';
  } else {
    copyBtn.style.display = 'none';
  }
  
  renderProgress(0, 1);
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

async function copyToClipboard(text: string) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
  } else {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
  }
}

async function handleCopyClick() {
  const output = $('output');
  const copyBtn = $('copyBtn');
  const text = output.textContent || '';
  if (!text.trim()) return;
  try {
    await copyToClipboard(text);
    const originalHTML = copyBtn.innerHTML;
    copyBtn.innerHTML = `
      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
      </svg>
      Copied!
    `;
    copyBtn.classList.add('bg-green-100', 'text-green-700');
    copyBtn.classList.remove('bg-slate-100', 'text-slate-700');
    setTimeout(() => {
      copyBtn.innerHTML = originalHTML;
      copyBtn.classList.remove('bg-green-100', 'text-green-700');
      copyBtn.classList.add('bg-slate-100', 'text-slate-700');
    }, 1500);
  } catch (err) {
    console.error('Copy failed:', err);
  }
}

function initBeautifyUI() {
  beautifyWorkerService.prewarm();
  const btn = $('formatBtn');
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    handleFormatClick();
  });
  const copyBtn = $('copyBtn');
  copyBtn.addEventListener('click', (e) => {
    e.preventDefault();
    handleCopyClick();
  });
  const input = $('input') as HTMLTextAreaElement;
  input.addEventListener('focus', () => {
    input.select();
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initBeautifyUI);
} else {
  initBeautifyUI();
}

window.addEventListener('beforeunload', () => beautifyWorkerService.dispose());

