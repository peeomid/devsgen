import type { Token, BeautifyOptions } from '../../../types/beautify.ts';

export function preprocessTokensJsonish(tokens: Token[], options: BeautifyOptions): Token[] {
  if (options.conservative) return tokens;
  return tokens.map(token => {
    if (token.type === 'string') {
      // Normalize single quotes to double quotes when safe
      return normalizeQuotes(token);
    }
    return token;
  });
}

export function postprocessOutputJsonish(output: string, options: BeautifyOptions): string {
  if (options.conservative) return output;
  // Remove trailing commas before closing brackets conservatively
  return removeTrailingCommas(output);
}

function normalizeQuotes(token: Token): Token {
  const { value } = token;
  
  // Only normalize if it starts and ends with single quotes
  if (value.startsWith("'") && value.endsWith("'") && value.length >= 2) {
    const content = value.slice(1, -1);
    
    // Check if content contains unescaped double quotes
    let hasUnescapedDoubles = false;
    let i = 0;
    while (i < content.length) {
      if (content[i] === '"') {
        // Count preceding backslashes
        let backslashes = 0;
        let j = i - 1;
        while (j >= 0 && content[j] === '\\') {
          backslashes++;
          j--;
        }
        if (backslashes % 2 === 0) {
          hasUnescapedDoubles = true;
          break;
        }
      }
      i++;
    }
    
    // Only convert if it's safe to do so
    if (!hasUnescapedDoubles) {
      // Escape any backslashes and convert
      const escapedContent = content.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      return {
        ...token,
        value: `"${escapedContent}"`
      };
    }
  }
  
  return token;
}

function removeTrailingCommas(output: string): string {
  // Remove trailing commas before closing brackets/braces
  return output.replace(/,(\s*[\]}])/g, '$1');
}
