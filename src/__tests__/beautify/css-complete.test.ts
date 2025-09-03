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

describe('CSS Complete Output', () => {
  test('formats minified CSS into readable blocks', () => {
    const input = `body{margin:0;padding:0}h1{font-size:2rem;color:#333}`;
    const out = beautify(input, opts).output;
    const expected = `body {
  margin: 0;
  padding: 0;
}

h1 {
  font-size: 2rem;
  color: #333;
}
`;
    expect(out).toBe(expected);
  });
});
