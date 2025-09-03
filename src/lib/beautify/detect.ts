import type { Detected } from '../../types/beautify.ts';

export function detectType(src: string): Detected {
  const s = src.trim();
  if (!s) return 'unknown';

  // Fast path: valid JSON
  try {
    JSON.parse(s);
    return 'json';
  } catch {}

  // SQL heuristics: SELECT ... FROM, or common DML/DDL keywords
  if (/\b(select|with)\b[\s\S]*\bfrom\b/i.test(s) ||
      /\b(insert\s+into|update\s+\w+\s+set|delete\s+from|create\s+table|alter\s+table|drop\s+table)\b/i.test(s)) {
    return 'sql';
  }

  // YAML heuristics (inline maps with braces but without semicolons)
  if (/^\s*[\w-]+\s*:\s*\{[^};]+\}\s*$/m.test(s)) {
    return 'yaml';
  }

  // CSS heuristics: require at least one semicolon inside braces to avoid JS objects and YAML
  if (/{[^}]*;[^}]*}/m.test(s)) {
    return 'css';
  }

  // XML heuristics: xml declaration or self-closing tags pattern predominates
  if (/^\s*<\?xml\b/.test(s) || /<\w+[^>]*\/>/.test(s)) {
    return 'xml';
  }

  // HTML heuristics: presence of common HTML tags or doctype
  if (/<!DOCTYPE\s+html/i.test(s) || /<\s*(html|body|div|span|ul|li|p|head|meta|link|script)\b/i.test(s)) {
    return 'html';
  }

  // YAML heuristics: multiple lines with key: value and no braces, or leading dashes
  if (!/[{}<>]/.test(s) && /\n/.test(s) && /^(\s*[-\w]+\s*:\s*.+)$/m.test(s)) {
    return 'yaml';
  }

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
    case 'css':
      return 'structure';
    case 'sql':
      return 'structure';
    case 'html':
    case 'xml':
    case 'yaml':
      return 'structure';
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
