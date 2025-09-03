function normalizeAttrs(attrs: string): string {
  const out: string[] = [];
  const re = /(\w[\w:-]*)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(attrs))) {
    const key = m[1];
    const val = m[2];
    out.push(`${key}=${val}`);
  }
  return out.join(' ');
}

export function formatXml(input: string, indentStr = '  '): string {
  const tokens: { type: 'tag'|'text'; value: string }[] = [];
  let lastIndex = 0;
  const tagRe = /<[^>]+>/g;
  let m: RegExpExecArray | null;
  while ((m = tagRe.exec(input))) {
    const idx = m.index;
    if (idx > lastIndex) {
      const text = input.slice(lastIndex, idx);
      tokens.push({ type: 'text', value: text });
    }
    tokens.push({ type: 'tag', value: m[0] });
    lastIndex = tagRe.lastIndex;
  }
  if (lastIndex < input.length) tokens.push({ type: 'text', value: input.slice(lastIndex) });

  let indent = 0;
  let out = '';
  const stack: string[] = [];
  let lastWasText = false;
  const nl = (lvl = indent) => { out += '\n' + indentStr.repeat(lvl); };

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.type === 'text') {
      const txt = t.value.replace(/\s+/g, ' ').trim();
      if (!txt) continue;
      // append inline text without prefixing a space
      out += txt;
      lastWasText = true;
      continue;
    }
    const tag = t.value;
    const isClosing = /^<\//.test(tag);
    const isDecl = /^<\?xml/.test(tag) || /^<!--/.test(tag);
    const selfClose = /\/>$/.test(tag);

    if (isDecl) {
      if (!out.endsWith('\n') && out.length) nl(0);
      out += tag;
      lastWasText = false;
      continue;
    }
    if (isClosing) {
      indent = Math.max(0, indent - 1);
      const name = /^<\s*\/\s*([\w:-]+)/.exec(tag)?.[1] || '';
      const top = stack[stack.length - 1];
      if (top === name && lastWasText && !out.endsWith('\n')) {
        // inline close for text-only content of this element
        out += `</${name}>`;
      } else {
        nl(indent);
        out += `</${name}>`;
      }
      if (stack.length) stack.pop();
      lastWasText = false;
      continue;
    }
    // open or self-close
    const name = /^<\s*([\w:-]+)/.exec(tag)?.[1] || '';
    const attrPart = tag.replace(/^<\s*[\w:-]+\s*|\/?\s*>$/g, '');
    const normAttr = attrPart ? normalizeAttrs(attrPart) : '';

    if (!out.endsWith('\n') && out.length) nl();
    out += `<${name}${normAttr ? ' ' + normAttr : ''}${selfClose ? ' /' : ''}>`;
    if (!selfClose) { indent++; stack.push(name); }
    lastWasText = false;
  }

  if (!out.endsWith('\n')) out += '\n';
  return out;
}
