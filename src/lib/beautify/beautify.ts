import type { BeautifyOptions, BeautifyResult, BeautifyDiagnostics } from '../../types/beautify.ts';
import { BracketFormatterService } from '../../services/BracketFormatterService.ts';
import { detectType, suggestModeFromDetection } from './detect.ts';
import { formatSql } from './sqlFormatter.ts';
import { formatCss } from './cssFormatter.ts';
import { formatHtml } from './htmlFormatter.ts';
import { formatXml } from './xmlFormatter.ts';
import { formatYaml } from './yamlFormatter.ts';
import { formatPhpVarDump } from './phpVarDump.ts';

export { detectType, suggestModeFromDetection };

export function beautify(text: string, options: BeautifyOptions): BeautifyResult {
  const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
  
  try {
    const indentStr = options.useTabs ? '\t' : ' '.repeat(options.indent);
    
    // Detect type for potential post-processing
    const detected = detectType(text);
    
    // Check for unbalanced brackets before formatting
    const diagnostics = analyzeBracketBalance(text);
    
    // Use specialized formatters or fall back to BracketFormatterService
    let output: string;
    if (detected === 'phpVarDump') {
      output = formatPhpVarDump(text, indentStr);
    } else if (detected === 'sql') {
      output = formatSql(text, indentStr);
    } else if (detected === 'css') {
      output = formatCss(text, indentStr);
    } else if (detected === 'html') {
      output = formatHtml(text, indentStr);
    } else if (detected === 'xml') {
      output = formatXml(text, indentStr);
    } else if (detected === 'yaml') {
      output = formatYaml(text, indentStr);
    } else {
      output = BracketFormatterService.format(text, indentStr);
    }

    // Insert newline between adjacent top-level structures like '}{' → '}\n{'
    // Skip this for PHP var_dump as it corrupts the format
    if (detected !== 'phpVarDump') {
      output = insertNewlineBetweenTopLevel(output);
      output = insertNewlineAfterCloserBeforeIdentifier(output);
    }

    // Minimal Python block indentation: if a line ends with ':', ensure the
    // next non-empty line has at least one indentStr prefix. Applied heuristically
    // when code appears to contain Python def/class blocks.
    if (/(^|\n)\s*(def|class)\b.*:\s*$/m.test(text)) {
      output = ensurePythonBlockIndent(output, indentStr);
    }

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
          // Don't add newline for function definitions like "function name() {"
          const isAfterFunction = ch === ')' && out.includes('function ') && 
            out.substring(out.lastIndexOf('function ')).includes('(');
          
          if (!isAfterFunction && !out.endsWith('\n')) {
            out += '\n';
          }
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

function insertNewlineAfterCloserBeforeIdentifier(formatted: string): string {
  let out = '';
  let i = 0;
  let inSingle = false;
  let inDouble = false;
  let escape = false;
  const isIdentStart = (c: string) => /[A-Za-z_$]/.test(c);

  while (i < formatted.length) {
    const ch = formatted[i];
    out += ch;

    if (escape) { escape = false; i++; continue; }
    if ((inSingle || inDouble) && ch === '\\') { escape = true; i++; continue; }

    if (!inDouble && ch === "'" && !inSingle) { inSingle = true; i++; continue; }
    if (inSingle && ch === "'") { inSingle = false; i++; continue; }
    if (!inSingle && ch === '"' && !inDouble) { inDouble = true; i++; continue; }
    if (inDouble && ch === '"') { inDouble = false; i++; continue; }

    if (!inSingle && !inDouble && ch === '}') {
      // Look ahead for next non-whitespace character
      let j = i + 1;
      while (j < formatted.length && /\s/.test(formatted[j])) j++;
      if (j < formatted.length && isIdentStart(formatted[j])) {
        if (!out.endsWith('\n')) {
          // derive current line indentation (spaces/tabs before this '}')
          let k = out.length - 1;
          while (k >= 0 && out[k] !== '\n') k--;
          let indent = '';
          let p = k + 1;
          while (p < out.length && (out[p] === ' ' || out[p] === '\t')) { indent += out[p]; p++; }
          out += '\n' + indent;
        }
      }
    }

    i++;
  }

  return out;
}

function ensurePythonBlockIndent(formatted: string, indentStr: string): string {
  const lines = formatted.split('\n');
  let out: string[] = [];
  let prevEndsWithColon = false;
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    const trimmed = line.trim();
    if (prevEndsWithColon && trimmed.length > 0) {
      // Ensure at least one configured indent at start of line
      const leading = (line.match(/^\s*/) || [''])[0];
      if (leading.length === 0) {
        line = indentStr + line;
      } else if (!leading.startsWith(indentStr)) {
        // Replace existing smaller/mismatched leading whitespace with indentStr
        line = indentStr + line.slice(leading.length);
      }
      prevEndsWithColon = false;
    }
    out.push(line);
    // Update flag for next iteration based on current line (use original text)
    if (trimmed.endsWith(':')) {
      prevEndsWithColon = true;
    } else if (trimmed.length > 0) {
      prevEndsWithColon = false;
    }
  }
  // Ensure trailing newline consistency
  let joined = out.join('\n');
  if (!joined.endsWith('\n')) joined += '\n';
  return joined;
}
