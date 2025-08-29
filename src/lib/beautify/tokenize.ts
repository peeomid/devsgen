import type { Token, TokenType } from '../../types/beautify.ts';

type TokenizeState = 
  | 'default'
  | 'string'
  | 'lineComment'
  | 'blockComment';

interface TokenizeOptions {
  keepComments: boolean;
}

export function tokenize(src: string, options: TokenizeOptions = { keepComments: true }): Token[] {
  const tokens: Token[] = [];
  let state: TokenizeState = 'default';
  let i = 0;
  let stringQuote = '';
  let tokenStart = 0;

  const addToken = (type: TokenType, start: number, end: number, bracket?: Token['bracket']) => {
    const value = src.slice(start, end);
    tokens.push({ type, value, bracket, start, end });
  };

  const skipWhitespace = () => {
    const start = i;
    while (i < src.length && /\s/.test(src[i])) {
      i++;
    }
    if (i > start) {
      addToken('other', start, i);
    }
  };

  while (i < src.length) {
    const ch = src[i];
    const next = src[i + 1] || '';

    switch (state) {
      case 'default':
        if (ch === '"' || ch === "'") {
          state = 'string';
          stringQuote = ch;
          tokenStart = i;
        } else if (ch === '/' && next === '/') {
          state = 'lineComment';
          tokenStart = i;
        } else if (ch === '#') {
          state = 'lineComment';
          tokenStart = i;
        } else if (ch === '/' && next === '*') {
          state = 'blockComment';
          tokenStart = i;
        } else if (ch === '=' && next === '>') {
          // PHP-style arrow '=>'
          addToken('other', i, i + 2);
          i++; // skip '>' as well
        } else if (ch === '{' || ch === '[' || ch === '(') {
          skipWhitespace();
          addToken('open', i, i + 1, ch as Token['bracket']);
        } else if (ch === '}' || ch === ']' || ch === ')') {
          skipWhitespace();
          addToken('close', i, i + 1, ch as Token['bracket']);
        } else if (ch === ',') {
          skipWhitespace();
          addToken('comma', i, i + 1);
        } else if (ch === ':') {
          skipWhitespace();
          addToken('colon', i, i + 1);
        } else if (/\s/.test(ch)) {
          skipWhitespace();
          continue; // skipWhitespace handles incrementing i
        } else {
          // Collect other tokens (identifiers, numbers, etc.)
          tokenStart = i;
          while (i < src.length && 
                 !(/\s/.test(src[i])) && 
                 !('{}[](),:'.includes(src[i])) &&
                 !(src[i] === '/' && (src[i + 1] === '/' || src[i + 1] === '*')) &&
                 src[i] !== '#' &&
                 src[i] !== '"' && 
                 src[i] !== "'") {
            i++;
          }
          if (i > tokenStart) {
            addToken('other', tokenStart, i);
          }
          continue; // Skip the i++ at the end
        }
        break;

      case 'string':
        if (ch === stringQuote && (i === 0 || src[i - 1] !== '\\')) {
          // Check for proper escape handling - count preceding backslashes
          let escapeCount = 0;
          let j = i - 1;
          while (j >= 0 && src[j] === '\\') {
            escapeCount++;
            j--;
          }
          if (escapeCount % 2 === 0) {
            // Even number of backslashes means the quote is not escaped
            addToken('string', tokenStart, i + 1);
            state = 'default';
          }
        }
        break;

      case 'lineComment':
        if (ch === '\n' || ch === '\r') {
          if (options.keepComments) {
            addToken('comment', tokenStart, i);
          }
          state = 'default';
          continue; // Don't increment i, let default state handle the newline
        }
        break;

      case 'blockComment':
        if (ch === '*' && next === '/') {
          if (options.keepComments) {
            addToken('comment', tokenStart, i + 2);
          }
          state = 'default';
          i++; // Skip the '/' as well
        }
        break;
    }

    i++;
  }

  // Handle unterminated states
  if (state === 'string') {
    addToken('string', tokenStart, src.length);
  } else if (state === 'lineComment' && options.keepComments) {
    addToken('comment', tokenStart, src.length);
  } else if (state === 'blockComment' && options.keepComments) {
    addToken('comment', tokenStart, src.length);
  }

  return tokens;
}

// Helper function to get bracket pairs
export function getBracketPair(bracket: string): string {
  const pairs: Record<string, string> = {
    '{': '}',
    '[': ']',
    '(': ')',
    '}': '{',
    ']': '[',
    ')': '('
  };
  return pairs[bracket] || '';
}

// Helper function to check if brackets match
export function bracketsMatch(open: string, close: string): boolean {
  const pairs: Record<string, string> = {
    '{': '}',
    '[': ']',
    '(': ')'
  };
  return pairs[open] === close;
}
