export function formatSql(input: string, indentStr = '  '): string {
  // Simple SQL formatter: uppercases keywords, line breaks before major clauses,
  // splits select list and conditions, and indents JOIN/ON blocks.
  const KW = new Set([
    'SELECT','FROM','WHERE','JOIN','INNER','LEFT','RIGHT','FULL','OUTER','CROSS','ON','AS','AND','OR',
    'GROUP','BY','ORDER','HAVING','LIMIT','OFFSET','UNION','ALL','DISTINCT','WITH','INSERT','INTO','VALUES',
    'UPDATE','SET','DELETE','CREATE','TABLE'
  ]);

  type Tok = { v: string; t: 'word'|'string'|'symbol'|'space' };
  const toks: Tok[] = [];
  let i = 0; const s = input;
  let inS = false, inD = false, esc = false;
  while (i < s.length) {
    const ch = s[i];
    if (inS) {
      let buf = "'"; i++;
      while (i < s.length) {
        const c = s[i++]; buf += c;
        if (c === "'" && s[i-2] !== '\\') { inS = false; break; }
      }
      toks.push({ v: buf, t: 'string' });
      continue;
    }
    if (inD) {
      let buf = '"'; i++;
      while (i < s.length) {
        const c = s[i++]; buf += c;
        if (c === '"' && s[i-2] !== '\\') { inD = false; break; }
      }
      toks.push({ v: buf, t: 'string' });
      continue;
    }
    if (ch === "'") { inS = true; continue; }
    if (ch === '"') { inD = true; continue; }
    if (/\s/.test(ch)) { let j=i; while (j<s.length && /\s/.test(s[j])) j++; toks.push({ v: ' ', t: 'space' }); i=j; continue; }
    if (/[A-Za-z0-9_\.]/.test(ch)) { let j=i; while (j<s.length && /[A-Za-z0-9_\.]/.test(s[j])) j++; toks.push({ v: s.slice(i,j), t:'word' }); i=j; continue; }
    // symbols
    toks.push({ v: ch, t: 'symbol' }); i++;
  }

  function isWord(tok?: Tok, v?: string) { return tok && tok.t==='word' && (!v || tok.v.toUpperCase()===v); }
  function upperIfKw(tok: Tok): Tok { if (tok.t==='word' && KW.has(tok.v.toUpperCase())) return { ...tok, v: tok.v.toUpperCase() }; return tok; }

  // Uppercase keywords
  for (let k=0;k<toks.length;k++) toks[k] = upperIfKw(toks[k]);

  let out = '';
  let indent = 0;
  let needNewline = false;
  let nextLineIndent: number | null = null;
  let clause: 'SELECT'|'FROM'|'WHERE'|'GROUP BY'|'ORDER BY'|'JOIN'|'OTHER' = 'OTHER';
  const newline = (lvl = indent) => { out += '\n' + indentStr.repeat(lvl); };

  const keywordAt = (idx: number, w: string) => isWord(toks[idx], w);
  const trimTrail = () => { while (out.endsWith(' ')) out = out.slice(0, -1); };

  for (let k=0; k<toks.length; k++) {
    const tok = toks[k];
    // Handle compound keywords
    if (keywordAt(k,'GROUP') && keywordAt(k+2,'BY')) { toks[k].v='GROUP BY'; toks[k+1]={v:' ',t:'space'}; toks[k+2]={v:'',t:'space'}; }
    if (keywordAt(k,'ORDER') && keywordAt(k+2,'BY')) { toks[k].v='ORDER BY'; toks[k+1]={v:' ',t:'space'}; toks[k+2]={v:'',t:'space'}; }
  }

  for (let k=0; k<toks.length; k++) {
    const tok = toks[k];
    const val = tok.v;
    if (tok.t==='space') { if (needNewline) { continue; } if (!out.endsWith(' ') && !out.endsWith('\n')) out += ' '; continue; }
    if (tok.t==='word') {
      const upper = val.toUpperCase();
      if (upper === 'SELECT') { if (out.trim()) { trimTrail(); newline(0); } out += 'SELECT'; clause='SELECT'; indent=1; needNewline = true; nextLineIndent = 1; continue; }
      if (upper === 'FROM') { trimTrail(); newline(0); out += 'FROM'; clause='FROM'; indent=1; needNewline = true; nextLineIndent = 1; continue; }
      if (upper === 'WHERE') { trimTrail(); newline(0); out += 'WHERE'; clause='WHERE'; indent=1; needNewline = true; nextLineIndent = 1; continue; }
      if (upper === 'GROUP BY') { trimTrail(); newline(0); out += 'GROUP BY'; clause='GROUP BY'; indent=1; needNewline = true; nextLineIndent = 1; continue; }
      if (upper === 'ORDER BY') { trimTrail(); newline(0); out += 'ORDER BY'; clause='ORDER BY'; indent=1; needNewline = true; nextLineIndent = 1; continue; }
      if (upper === 'LIMIT' || upper==='OFFSET') { trimTrail(); newline(0); out += upper; clause='OTHER'; indent=1; needNewline = true; nextLineIndent = 1; continue; }
      if (upper === 'JOIN' || upper==='INNER' || upper==='LEFT' || upper==='RIGHT' || upper==='FULL' || upper==='CROSS' || upper==='OUTER') {
        // Handle JOIN variants possibly split across tokens
        const ahead = toks.slice(k, k+4).map(t=>t.v.toUpperCase()).join(' ');
        if (/\b(INNER|LEFT|RIGHT|FULL|CROSS|OUTER)?\s*JOIN\b/.test(ahead)) {
          trimTrail(); newline(0); out += upper; clause='JOIN'; needNewline = true; nextLineIndent = 1; continue;
        }
      }
      if (upper === 'ON') { trimTrail(); newline(0); out += 'ON'; clause='JOIN'; needNewline = true; nextLineIndent = 1; continue; }

      // Default word emission
      if (needNewline) { 
        // Trim trailing spaces before newline
        while (out.endsWith(' ')) out = out.slice(0, -1);
        newline(nextLineIndent ?? indent); needNewline = false; nextLineIndent = null;
      }
      if (!out.endsWith(' ') && !out.endsWith('\n')) out += ' ';
      out += val;
      continue;
    }

    if (tok.t==='symbol') {
      const sym = val;
      if (sym === ',') {
        out += ','; 
        if (clause==='SELECT' || clause==='ORDER BY' || clause==='GROUP BY') { newline(indent); }
        else out += ' ';
        continue;
      }
      if (sym === '(' || sym === '[') { out += sym; indent++; newline(indent); continue; }
      if (sym === ')' || sym === ']') { indent=Math.max(0, indent-1); newline(indent); out += sym; continue; }
      if (sym === ';') { out += ';'; newline(0); continue; }
      if (/=|<|>|!/.test(sym)) { if (!out.endsWith(' ') && !out.endsWith('\n')) out += ' '; out += sym; out += ' '; continue; }
      // default symbol
      out += sym;
      continue;
    }

    // strings
    if (tok.t==='string') { if (!out.endsWith(' ') && !out.endsWith('\n')) out += ' '; out += tok.v; continue; }
  }

  if (!out.endsWith('\n')) out += '\n';
  return out;
}
