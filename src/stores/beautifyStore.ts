import { atom, map } from 'nanostores';
import type { BeautifyOptions, BeautifyResult, BeautifyMode } from '../types/beautify.ts';
import { detectType, suggestModeFromDetection } from '../lib/beautify/beautify.ts';

// Default options
export const defaultOptions: BeautifyOptions = {
  mode: 'structure',
  indent: 2,
  useTabs: false,
  newlineAfterComma: true,
  keepComments: true,
  conservative: false,
};

// Persistent options store
export const beautifyOptions = map<BeautifyOptions>(() => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('beautify-options');
    if (saved) {
      try {
        return { ...defaultOptions, ...JSON.parse(saved) };
      } catch {
        // Fall back to defaults if parsing fails
      }
    }
  }
  return defaultOptions;
});

// Input text store
export const inputText = atom('');

// Output result store
export const outputResult = atom<BeautifyResult | null>(null);

// Format on type toggle
export const formatOnType = atom(false);

// Loading/processing state
export const isProcessing = atom(false);

// Progress state
export const processingProgress = atom<{ processed: number; total: number } | null>(null);

// Auto-detect mode from input
export const autoDetectedMode = atom<BeautifyMode>('structure');

// Actions
export function updateOption<K extends keyof BeautifyOptions>(
  key: K,
  value: BeautifyOptions[K]
) {
  const current = beautifyOptions.get();
  const updated = { ...current, [key]: value };
  beautifyOptions.set(updated);
  
  // Persist to localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem('beautify-options', JSON.stringify(updated));
  }
}

export function setInputText(text: string) {
  inputText.set(text);
  
  // Auto-detect mode
  if (text.trim()) {
    const detected = detectType(text);
    const suggested = suggestModeFromDetection(detected);
    autoDetectedMode.set(suggested);
  } else {
    autoDetectedMode.set('structure');
  }
}

export function setOutputResult(result: BeautifyResult | null) {
  outputResult.set(result);
}

export function setProcessing(processing: boolean) {
  isProcessing.set(processing);
  if (!processing) {
    processingProgress.set(null);
  }
}

export function setProcessingProgress(processed: number, total: number) {
  processingProgress.set({ processed, total });
}

export function toggleFormatOnType() {
  formatOnType.set(!formatOnType.get());
}

export function resetToDefaults() {
  beautifyOptions.set(defaultOptions);
  if (typeof window !== 'undefined') {
    localStorage.removeItem('beautify-options');
  }
}