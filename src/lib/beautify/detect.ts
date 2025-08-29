import type { Detected } from '../../types/beautify.ts';

export function detectType(src: string): Detected {
  const s = src.trim();
  if (!s) return 'unknown';

  // Fast path: valid JSON
  try {
    JSON.parse(s);
    return 'json';
  } catch {}

  // PHP array or var_dump heuristics
  if (/\barray\s*\(/i.test(s) || /=>/.test(s) || /\[\s*[^\]]*=>/m.test(s)) {
    if (/=>\s*(string|int|float|array|object)\s*\(/i.test(s) || /\[\s*"?.+?"?\]\s*=>/m.test(s)) {
      return 'phpVarDump';
    }
    return 'phpArray';
  }

  // Python repr heuristics: single-quoted keys/strings, True/False/None, tuples
  if (/(^|[\s\[{(])'(?:[^'\\]|\\.)*'/.test(s) || /\b(True|False|None)\b/.test(s) || /\((?:[^()]*,)[^()]*\)/.test(s)) {
    return 'pythonRepr';
  }

  // JSON-like but not strict JSON: comments, trailing commas, single quotes
  if (/\/\/|#/.test(s) || /,\s*[\]}]/.test(s) || /(^|[^\\])'(?:[^'\\]|\\.)*'/.test(s)) {
    return 'jsonish';
  }

  return 'unknown';
}

export function suggestModeFromDetection(detected: Detected): 'structure' | 'jsonish' | 'phpish' {
  switch (detected) {
    case 'json':
    case 'jsonish':
      return 'jsonish';
    case 'phpArray':
    case 'phpVarDump':
      return 'phpish';
    case 'pythonRepr':
      return 'structure'; // Python repr works well with structure mode
    case 'unknown':
    default:
      return 'structure';
  }
}