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

describe('HTML Complete Output', () => {
  test('formats nested elements with attribute spacing preserved', () => {
    const input = `<div><span class="n">Hi</span><ul><li>1</li><li>2</li></ul></div>`;
    const expected = `<div>
  <span class="n">Hi</span>
  <ul>
    <li>1</li>
    <li>2</li>
  </ul>
</div>
`;
    const out = beautify(input, opts).output;
    expect(out).toBe(expected);
  });
});

