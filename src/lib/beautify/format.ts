import type { Token, BeautifyOptions, BeautifyResult, BeautifyDiagnostics } from '../../types/beautify.ts';
import { bracketsMatch } from './tokenize.ts';

interface FormatterState {
  indentLevel: number;
  indentStack: string[];
  indentDeltaStack: number[];
  output: string[];
  diagnostics: BeautifyDiagnostics;
}

export function format(tokens: Token[], options: BeautifyOptions): BeautifyResult {
  const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
  
  const state: FormatterState = {
    indentLevel: 0,
    indentStack: [],
    indentDeltaStack: [],
    output: [],
    diagnostics: {
      warnings: [],
      unbalancedBrackets: false
    }
  };

  const indentString = options.useTabs ? '\t' : ' '.repeat(options.indent);

  const addIndent = (level: number = state.indentLevel) => {
    return indentString.repeat(level);
  };

  const addNewlineWithIndent = (level: number = state.indentLevel) => {
    state.output.push('\n' + addIndent(level));
  };

  const trimTrailingWhitespace = () => {
    const lastIndex = state.output.length - 1;
    if (lastIndex >= 0 && typeof state.output[lastIndex] === 'string') {
      state.output[lastIndex] = state.output[lastIndex].replace(/\s+$/, '');
    }
  };

  let i = 0;
  while (i < tokens.length) {
    const token = tokens[i];

    switch (token.type) {
      case 'open':
        // Insert a space before '{' if previous emitted char isn't whitespace or a newline
        if (token.bracket === '{') {
          const last = state.output[state.output.length - 1] || '';
          if (last && !/[\s\n]$/.test(last)) {
            state.output.push(' ');
          }
        }
        state.output.push(token.value);
        state.indentStack.push(token.bracket!);

        // Decide whether to increase indent for this open
        let inc = 1;
        if (token.bracket === '(') {
          const prev = findPrevNonWhitespace(tokens, i);
          const prevVal = prev && prev.type === 'other' ? prev.value.trim() : '';
          if (/^(int|string|float|object)$/i.test(prevVal)) {
            inc = 0; // inline type calls like int(42)
          } else if (/^array$/i.test(prevVal)) {
            // If this is array(N) followed by '{', keep inline
            const closeIndex = findMatchingCloseIndex(tokens, i);
            if (closeIndex != null) {
              const after = findNextNonWhitespace(tokens, closeIndex);
              if (after && after.type === 'open' && after.bracket === '{') {
                inc = 0;
              }
            }
          } else {
            // Fallback: short paren groups without commas stay inline, e.g., (42)
            const closeIndex = findMatchingCloseIndex(tokens, i);
            if (closeIndex != null) {
              let hasCommaOrNested = false;
              for (let k = i + 1; k < closeIndex; k++) {
                const tk = tokens[k];
                if (tk.type === 'comma' || tk.type === 'open' || tk.type === 'close') {
                  hasCommaOrNested = true;
                  break;
                }
              }
              if (!hasCommaOrNested) {
                inc = 0;
              }
            }
          }
        } else if (token.bracket === '[') {
          // Keep bracketed keys like ["id"] or [0] inline (no extra indent)
          const closeIndex = findMatchingCloseIndex(tokens, i);
          if (closeIndex != null) {
            let complex = false;
            for (let k = i + 1; k < closeIndex; k++) {
              const tk = tokens[k];
              if (tk.type === 'open' || tk.type === 'close' || tk.type === 'comma' || tk.type === 'colon') {
                complex = true;
                break;
              }
            }
            if (!complex) {
              inc = 0;
            }
          }
        }
        state.indentDeltaStack.push(inc);
        state.indentLevel += inc;
        
        // Look ahead to see if this is an empty structure
        const nextNonWhitespace = findNextNonWhitespace(tokens, i);
        if (inc === 0) {
          // Inline parens: don't add newline
        } else if (nextNonWhitespace && nextNonWhitespace.type === 'close' && 
            bracketsMatch(token.bracket!, nextNonWhitespace.bracket!)) {
          // Empty structure - don't add newline
        } else {
          addNewlineWithIndent();
        }
        break;

      case 'close':
        const expectedOpen = state.indentStack.pop();
        const incClose = state.indentDeltaStack.pop() ?? 1;
        state.indentLevel = Math.max(0, state.indentLevel - incClose);
        
        if (!expectedOpen || !bracketsMatch(expectedOpen, token.bracket!)) {
          state.diagnostics.warnings.push(`Unmatched closing bracket: ${token.value}`);
          state.diagnostics.unbalancedBrackets = true;
        }
        
        // Check if the previous token was an opening bracket (empty structure)
        const prevNonWhitespace = findPrevNonWhitespace(tokens, i);
        if (incClose !== 0) {
          if (!(prevNonWhitespace && prevNonWhitespace.type === 'open' && 
                bracketsMatch(prevNonWhitespace.bracket!, token.bracket!))) {
            trimTrailingWhitespace();
            addNewlineWithIndent();
          }
        }
        
        state.output.push(token.value);

        // If the next significant token is not a comma or another close,
        // add a newline so adjacent structures don't collapse together (e.g., `}{`).
        const nextToken = findNextNonWhitespace(tokens, i);
        // If an inline paren group is followed by a string, ensure a separating space
        if (nextToken && nextToken.type === 'string' && incClose === 0) {
          const last = state.output[state.output.length - 1] || '';
          if (last && !/[\s\n]$/.test(last)) {
            state.output.push(' ');
          }
        }
        // Avoid breaking between ") {" in phpish/var_dump style
        const avoidBreak =
          (nextToken && nextToken.type === 'open' && token.bracket === ')' && nextToken.bracket === '{');
        // Force a break after inline paren (e.g., int(42)) when next starts a new key like ["id"]
        const nextIsBracketKey = !!(
          nextToken && (
            (nextToken.type === 'open' && nextToken.bracket === '[') ||
            (nextToken.type === 'other' && /^\s*\[/.test(nextToken.value))
          )
        );
        const forceBreak = (incClose === 0 && nextIsBracketKey);
        if (nextToken && nextToken.type !== 'comma' && nextToken.type !== 'close' && (!avoidBreak || forceBreak)) {
          addNewlineWithIndent(state.indentLevel);
        }
        break;

      case 'comma':
        state.output.push(token.value);
        if (options.newlineAfterComma) {
          addNewlineWithIndent();
        } else {
          state.output.push(' ');
        }
        break;

      case 'colon':
        if (token.value === '=>') {
          // Consistent PHP arrow operator spacing: always add space before and after =>
          const last = state.output[state.output.length - 1] || '';
          if (last && !/[\s\n]$/.test(last)) {
            state.output.push(' ');
          }
          state.output.push('=>');
          state.output.push(' ');
        } else {
          state.output.push(token.value);
          state.output.push(' ');
        }
        break;

      case 'string':
        // In phpish var_dump, ensure a space between e.g., string(3) and the quoted content
        if (options.mode === 'phpish') {
          const last = state.output[state.output.length - 1] || '';
          if (last && !/[\s\n]$/.test(last) && /\)$/.test(last)) {
            state.output.push(' ');
          }
        }
        state.output.push(token.value);
        if (options.mode === 'phpish') {
          const nextTok = findNextNonWhitespace(tokens, i);
          if (nextTok && (
            (nextTok.type === 'other' && /^\s*\[/.test(nextTok.value)) ||
            (nextTok.type === 'open' && nextTok.bracket === '[')
          )) {
            addNewlineWithIndent();
          }
        }
        break;

      case 'comment':
        if (options.keepComments) {
          state.output.push(token.value);
        }
        break;

      case 'other':
        // Skip pure whitespace tokens, but preserve meaningful content
        if (token.value.trim()) {
          const v = token.value.trim();
          if (v === '=>') {
            // Consistent PHP arrow operator spacing: always add space before and after =>
            const last = state.output[state.output.length - 1] || '';
            if (last && !/[\s\n]$/.test(last)) {
              state.output.push(' ');
            }
            state.output.push('=>');
            state.output.push(' ');
          } else {
            state.output.push(v);
            // In phpish var_dump, after a scalar type call like int(42) or string(3),
            // if the next token is a new key, break the line
            if (options.mode === 'phpish' && /^(int|string|float|object)\s*\([^()]*\)$/.test(v)) {
              const nextTok = findNextNonWhitespace(tokens, i);
              if (nextTok && (
                (nextTok.type === 'other' && /^\s*\[/.test(nextTok.value)) ||
                (nextTok.type === 'open' && nextTok.bracket === '[')
              )) {
                addNewlineWithIndent();
              }
            }
          }
        }
        break;
    }

    i++;
  }

  // Check for unbalanced brackets
  if (state.indentStack.length > 0) {
    state.diagnostics.unbalancedBrackets = true;
    state.diagnostics.warnings.push(`Unclosed brackets: ${state.indentStack.join(', ')}`);
  }

  // Clean up output
  let output = state.output.join('');
  
  // Remove trailing whitespace from each line
  output = output.split('\n').map(line => line.replace(/\s+$/, '')).join('\n');
  
  // Ensure final newline
  if (output && !output.endsWith('\n')) {
    output += '\n';
  }

  const endTime = typeof performance !== 'undefined' ? performance.now() : Date.now();

  return {
    output,
    diagnostics: state.diagnostics,
    timeMs: endTime - startTime
  };
}

function findNextNonWhitespace(tokens: Token[], currentIndex: number): Token | null {
  for (let i = currentIndex + 1; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.type !== 'other' || token.value.trim()) {
      return token;
    }
  }
  return null;
}

function findPrevNonWhitespace(tokens: Token[], currentIndex: number): Token | null {
  for (let i = currentIndex - 1; i >= 0; i--) {
    const token = tokens[i];
    if (token.type !== 'other' || token.value.trim()) {
      return token;
    }
  }
  return null;
}

function findMatchingCloseIndex(tokens: Token[], openIndex: number): number | null {
  const open = tokens[openIndex];
  if (!open || open.type !== 'open') return null;
  const openBracket = open.bracket;
  const closeMap: Record<string, string> = { '(': ')', '[': ']', '{': '}' };
  const targetClose = closeMap[openBracket || ''];
  if (!targetClose) return null;
  let depth = 0;
  for (let i = openIndex; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.type === 'open' && t.bracket === openBracket) depth++;
    else if (t.type === 'close' && t.bracket === targetClose) {
      depth--;
      if (depth === 0) return i;
    }
  }
  return null;
}
