import type { BeautifyOptions, BeautifyResult, BeautifyDiagnostics } from '../../types/beautify.ts';
import { BracketFormatterService } from '../../services/BracketFormatterService.ts';
import { detectType, suggestModeFromDetection } from './detect.ts';

export { detectType, suggestModeFromDetection };

export function beautify(text: string, options: BeautifyOptions): BeautifyResult {
  const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
  
  try {
    const indentStr = options.useTabs ? '\t' : ' '.repeat(options.indent);
    
    // Check for unbalanced brackets before formatting
    const diagnostics = analyzeBracketBalance(text);
    
    // Use BracketFormatterService for all formatting
    let output = BracketFormatterService.format(text, indentStr);

    // Insert newline between adjacent top-level structures like '}{' → '}\n{'
    output = insertNewlineBetweenTopLevel(output);

    // Ensure a trailing newline for consistency with previous formatter behavior
    if (output && !output.endsWith('\n')) {
      output += '\n';
    }
    
    return {
      output,
      diagnostics,
      timeMs: (typeof performance !== 'undefined' ? performance.now() : Date.now()) - startTime
    };
  } catch (error) {
    return {
      output: text, // Return original text on error
      diagnostics: { 
        warnings: [`Formatting error: ${error instanceof Error ? error.message : String(error)}`] 
      },
      timeMs: (typeof performance !== 'undefined' ? performance.now() : Date.now()) - startTime
    };
  }
}

function analyzeBracketBalance(text: string): BeautifyDiagnostics {
  const warnings: string[] = [];
  let unbalancedBrackets = false;
  
  const stack: string[] = [];
  const pairs: Record<string, string> = { '(': ')', '[': ']', '{': '}' };
  const openers = new Set(['(', '[', '{']);
  const closers = new Set([')', ']', '}']);
  
  let inString = false;
  let stringChar = '';
  let escape = false;
  
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    
    if (escape) {
      escape = false;
      continue;
    }
    
    if (ch === '\\') {
      escape = true;
      continue;
    }
    
    if (!inString && (ch === '"' || ch === "'")) {
      inString = true;
      stringChar = ch;
      continue;
    }
    
    if (inString && ch === stringChar) {
      inString = false;
      stringChar = '';
      continue;
    }
    
    if (inString) continue;
    
    if (openers.has(ch)) {
      stack.push(ch);
    } else if (closers.has(ch)) {
      if (stack.length === 0) {
        unbalancedBrackets = true;
        warnings.push(`Unexpected closing bracket: ${ch} at position ${i}`);
      } else {
        const lastOpen = stack.pop()!;
        if (pairs[lastOpen] !== ch) {
          unbalancedBrackets = true;
          warnings.push(`Mismatched brackets: ${lastOpen} closed with ${ch} at position ${i}`);
        }
      }
    }
  }
  
  if (stack.length > 0) {
    unbalancedBrackets = true;
    warnings.push(`Unclosed brackets: ${stack.join(', ')}`);
  }
  
  return {
    warnings,
    unbalancedBrackets
  };
}

function insertNewlineBetweenTopLevel(formatted: string): string {
  let out = '';
  let depth = 0;
  let inSingle = false;
  let inDouble = false;
  let escape = false;

  for (let i = 0; i < formatted.length; i++) {
    const ch = formatted[i];

    if (escape) { out += ch; escape = false; continue; }
    if ((inSingle || inDouble) && ch === '\\') { out += ch; escape = true; continue; }

    if (!inDouble && ch === "'" && !inSingle) { inSingle = true; out += ch; continue; }
    if (inSingle && ch === "'") { inSingle = false; out += ch; continue; }
    if (!inSingle && ch === '"' && !inDouble) { inDouble = true; out += ch; continue; }
    if (inDouble && ch === '"') { inDouble = false; out += ch; continue; }

    if (inSingle || inDouble) { out += ch; continue; }

    const isOpener = ch === '{' || ch === '[' || ch === '(';
    const isCloser = ch === '}' || ch === ']' || ch === ')';

    if (isCloser) {
      // Write the closer and reduce depth
      out += ch;
      depth = Math.max(0, depth - 1);

      // Peek next non-whitespace
      let j = i + 1;
      while (j < formatted.length && /\s/.test(formatted[j])) j++;
      if (depth === 0 && j < formatted.length) {
        const next = formatted[j];
        if (next === '{' || next === '[' || next === '(') {
          if (!out.endsWith('\n')) out += '\n';
        }
      }
      continue;
    }

    if (isOpener) {
      depth++;
      out += ch;
      continue;
    }

    out += ch;
  }

  return out;
}
