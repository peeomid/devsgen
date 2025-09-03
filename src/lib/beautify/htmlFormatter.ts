const VOID_ELEMENTS = new Set([
  'area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'
]);

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

export function formatHtml(input: string, indentStr = '  '): string {
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
  if (lastIndex < input.length) {
    tokens.push({ type: 'text', value: input.slice(lastIndex) });
  }

  let indent = 0;
  let out = '';

  function nl(level = indent) {
    out += '\n' + indentStr.repeat(level);
  }

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.type === 'text') {
      const txt = t.value.replace(/\s+/g, ' ').trim();
      if (!txt) continue;
      // place inline text on same line
      if (!out.endsWith('\n')) out += ' ';
      out += txt;
      continue;
    }

    const tag = t.value;
    const isClosing = /^<\//.test(tag);
    const isComment = /^<!--/.test(tag);
    if (isComment) {
      nl();
      out += tag;
      continue;
    }

    const mName = /^<\/?\s*([a-zA-Z0-9:-]+)/.exec(tag);
    const name = mName ? mName[1].toLowerCase() : '';
    const isSelfClosing = /\/>$/.test(tag) || VOID_ELEMENTS.has(name);

    if (isClosing) {
      indent = Math.max(0, indent - 1);
      nl(indent);
      out += `</${name}>`;
      continue;
    }

    // opening tag
    const attrPart = tag.replace(/^<\s*[a-zA-Z0-9:-]+\s*|\/?\s*>$/g, '');
    const normAttr = attrPart ? normalizeAttrs(attrPart) : '';

    // Inline short span with plain text and immediate closing on same line
    const next = tokens[i + 1];
    const next2 = tokens[i + 2];
    const inlineText = next && next.type === 'text' && next.value.trim().length > 0 && (!/<|>/.test(next.value));
    const closesImmediately = next2 && next2.type === 'tag' && new RegExp(`^</\s*${name}[^>]*>`).test(next2.value);

    if (!out.endsWith('\n') && out.length > 0) nl();
    out += `<${name}${normAttr ? ' ' + normAttr : ''}>`;

    if (isSelfClosing) {
      // void element or explicit self-close; no indent change
      continue;
    }

    if (inlineText && closesImmediately) {
      out += next.value.trim();
      out += `</${name}>`;
      i += 2;
      continue;
    }

    indent++;
  }

  if (!out.endsWith('\n')) out += '\n';
  return out;
}

