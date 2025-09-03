function splitPairs(s: string): Array<[string, string]> {
  const pairs: Array<[string, string]> = [];
  let i = 0, key = '', val = '', inKey = true, inS = false, inD = false, esc = false;
  const push = () => {
    const k = key.trim();
    const v = val.trim();
    if (k) pairs.push([k, v]);
    key = ''; val = ''; inKey = true;
  };
  while (i < s.length) {
    const ch = s[i++];
    if (esc) { if (inKey) key += ch; else val += ch; esc = false; continue; }
    if (ch === '\\') { if (inKey) key += ch; else val += ch; esc = true; continue; }
    if (ch === '"' && !inS) { if (inKey) key += ch; else val += ch; inD = !inD; continue; }
    if (ch === '\'' && !inD) { if (inKey) key += ch; else val += ch; inS = !inS; continue; }
    if (!inS && !inD) {
      if (ch === ':' && inKey) { inKey = false; continue; }
      if (ch === ',') { push(); continue; }
    }
    if (inKey) key += ch; else val += ch;
  }
  push();
  return pairs;
}

export function formatYaml(input: string, indentStr = '  '): string {
  const lines = input.split(/\r?\n/);
  const out: string[] = [];
  for (const line of lines) {
    const m = /^\s*([A-Za-z0-9_-]+)\s*:\s*\{([^}]*)\}\s*$/.exec(line);
    if (m) {
      const key = m[1];
      const body = m[2];
      out.push(`${key}:`);
      const pairs = splitPairs(body);
      for (const [k, v] of pairs) {
        out.push(`${indentStr}${k.trim()}: ${v.trim()}`);
      }
    } else {
      out.push(line);
    }
  }
  return out.join('\n') + '\n';
}
