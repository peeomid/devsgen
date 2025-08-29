import type { Token, BeautifyOptions } from '../../../types/beautify.ts';

export function preprocessTokensPhpish(tokens: Token[], options: BeautifyOptions): Token[] {
  // In conservative mode, avoid token edits that would change output beyond indentation
  if (options.conservative) return tokens;

  const result: Token[] = [];
  let i = 0;

  const TYPE_IDENT_RE = /^(string|int|float|object)$/i;

  while (i < tokens.length) {
    const t = tokens[i];

    // Map '=>' to a colon-like token (no spaces; formatter handles spacing)
    if (t.type === 'other' && t.value.trim() === '=>') {
      result.push({ ...t, type: 'colon', value: '=>' });
      i++;
      continue;
    }

    // Collapse call-like parentheses for scalar types: int(…), string(…), float(…), object(…)
    if (t.type === 'other' && TYPE_IDENT_RE.test(t.value.trim())) {
      const next = tokens[i + 1];
      if (next && next.type === 'open' && next.bracket === '(') {
        let depth = 0;
        let j = i + 1;
        let collected = t.value;
        while (j < tokens.length) {
          const cur = tokens[j];
          collected += cur.value;
          if (cur.type === 'open' && cur.bracket === '(') depth++;
          else if (cur.type === 'close' && cur.bracket === ')') {
            depth--;
            if (depth === 0) { j++; break; }
          }
          j++;
        }
        result.push({ ...t, type: 'other', value: collected });
        i = j;
        continue;
      }
    }

    // Special-case array(…) in var_dump style: inline the (N) count only if followed by a '{'
    if (t.type === 'other' && /^array$/i.test(t.value.trim())) {
      const next = tokens[i + 1];
      if (next && next.type === 'open' && next.bracket === '(') {
        // Find matching close ')'
        let depth = 0;
        let j = i + 1;
        let collected = t.value;
        while (j < tokens.length) {
          const cur = tokens[j];
          collected += cur.value;
          if (cur.type === 'open' && cur.bracket === '(') depth++;
          else if (cur.type === 'close' && cur.bracket === ')') {
            depth--;
            if (depth === 0) { j++; break; }
          }
          j++;
        }
        // Lookahead for '{'
        let k = j;
        while (k < tokens.length && tokens[k].type === 'other' && !tokens[k].value.trim()) k++;
        if (k < tokens.length && tokens[k].type === 'open' && tokens[k].bracket === '{') {
          // var_dump style: inline the count
          result.push({ ...t, type: 'other', value: collected });
          i = j;
          continue;
        }
        // else: regular PHP array syntax; fall through without collapsing so '(' drives indentation
      }
    }

    // Collapse bracketed keys like ["id"] or [0] into a single token to avoid line breaks in var_dump
    if (t.type === 'open' && t.bracket === '[') {
      // Find matching close ']' without nesting
      let depth = 0;
      let j = i;
      let collected = '';
      while (j < tokens.length) {
        const cur = tokens[j];
        collected += cur.value;
        if (cur.type === 'open' && cur.bracket === '[') depth++;
        else if (cur.type === 'close' && cur.bracket === ']') {
          depth--;
          if (depth === 0) { j++; break; }
        }
        j++;
      }
      result.push({ ...t, type: 'other', value: collected, bracket: undefined });
      i = j;
      continue;
    }

    // Default: pass through
    result.push(t);
    i++;
  }

  return result;
}

export function postprocessOutputPhpish(output: string, _options: BeautifyOptions): string {
  // Formatting of '=>' spacing is handled in the formatter case-by-case.
  // No additional postprocessing required.
  return output;
}
