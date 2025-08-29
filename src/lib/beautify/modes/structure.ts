import type { Token, BeautifyOptions } from '../../../types/beautify.ts';

export function preprocessTokensStructure(tokens: Token[], _options: BeautifyOptions): Token[] {
  // Structure mode: no modifications, just pass through
  return tokens;
}

export function postprocessOutputStructure(output: string, _options: BeautifyOptions): string {
  // Structure mode: no modifications, just pass through
  return output;
}
