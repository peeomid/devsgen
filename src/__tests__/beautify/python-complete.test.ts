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

describe('Python sample (code, not repr) - preserve leading indent after newline', () => {
  test('keeps single leading space before return', () => {
    const input = `def add(a,b):\n return a+b\n\nclass T: pass`;
    const out = beautify(input, opts).output;
    const expected = `def add(a, b): \n  return a+b\n\nclass T: pass\n`;
    expect(out).toBe(expected);
  });
});
