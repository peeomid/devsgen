import { describe, test, expect } from 'vitest';
import { beautify } from '../../lib/beautify/beautify';
import type { BeautifyOptions } from '../../types/beautify';

const opts: BeautifyOptions = {
  mode: 'structure',
  indent: 2,
  useTabs: false,
  newlineAfterComma: true,
  keepComments: true,
  conservative: false,
};

describe('XML Complete Output', () => {
  test('formats nested elements and self-closing tags', () => {
    const input = `<root><item id="1"><name>A</name></item><item id="2"/></root>`;
    const expected = `<root>
  <item id="1">
    <name>A</name>
  </item>
  <item id="2" />
</root>
`;
    const out = beautify(input, opts).output;
    expect(out).toBe(expected);
  });
});

