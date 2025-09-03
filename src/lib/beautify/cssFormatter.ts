export function formatCss(input: string, indentStr = '  '): string {
  // Minimal CSS formatter: preserves hyphenated names, spaces after colon,
  // each declaration on its own line, blocks with braces on separate lines.
  let out = '';
  let indent = 0;
  let i = 0;
  const s = input.trim();

  const pushNL = () => { out += "\n" + indentStr.repeat(indent); };

  while (i < s.length) {
    const ch = s[i];

    if (ch === '{') {
      // selector end
      out = out.trimEnd();
      out += ' {';
      indent++;
      pushNL();
      i++;
      continue;
    }
    if (ch === '}') {
      out = out.trimEnd();
      // ensure we end last declaration with semicolon if there was a value
      const lastNonWs = (() => {
        for (let k = out.length - 1; k >= 0; k--) {
          const c = out[k];
          if (!/\s/.test(c)) return c;
        }
        return '';
      })();
      if (lastNonWs && lastNonWs !== ';' && lastNonWs !== '{' && lastNonWs !== '}') {
        out += ';';
      }
      if (!out.endsWith("\n")) out += "\n"; // avoid double-blank lines
      indent = Math.max(0, indent - 1);
      out += indentStr.repeat(indent) + '}';
      // Next selector or EOF
      if (i + 1 < s.length) out += "\n";
      i++;
      // remove extra spaces
      while (i < s.length && /\s/.test(s[i])) i++;
      continue;
    }

    if (ch === ';') {
      out = out.trimEnd();
      out += ';\n';
      out += indentStr.repeat(indent);
      i++;
      while (i < s.length && /\s/.test(s[i])) i++;
      continue;
    }

    if (ch === ':') {
      // ensure single space after colon
      out = out.trimEnd();
      out += ': ';
      i++;
      while (i < s.length && s[i] === ' ') i++;
      continue;
    }

    // collapse whitespace to single space outside of special cases
    if (/\s/.test(ch)) {
      if (!out.endsWith(' ') && !out.endsWith("\n")) out += ' ';
      i++;
      continue;
    }

    out += ch;
    i++;
  }

  if (!out.endsWith("\n")) out += "\n";
  return out;
}
