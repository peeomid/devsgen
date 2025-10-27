import { describe, test, expect } from 'vitest';
import { beautify } from '../../lib/beautify/beautify';
import type { BeautifyOptions } from '../../types/beautify';

const opts: BeautifyOptions = {
  mode: 'phpish',
  indent: 2,
  useTabs: false,
  newlineAfterComma: true,
  keepComments: true,
  conservative: false,
};

describe('PHP Dump Complete Output', () => {
  test('joins => with value and keeps array opener inline', () => {
    const input = `array(2) {\n  [\"user\"]=>\n  array(3) {\n    [\"id\"]=>\n    int(42)\n    [\"name\"]=>\n    string(5) \"Alice\"\n    [\"roles\"]=>\n    array(2) {\n      [0]=>\n      string(5) \"admin\"\n      [1]=>\n      string(4) \"user\"\n    }\n  }\n  [\"active\"]=>\n  bool(true)\n}`;

    const out = beautify(input, opts).output;
    const expected = `array(2) {\n  [\"user\"] =>\n  array(3) {\n    [\"id\"] => int(42)\n    [\"name\"] => string(5) \"Alice\"\n    [\"roles\"] =>\n    array(2) {\n      [0] => string(5) \"admin\"\n      [1] => string(4) \"user\"\n    }\n  }\n  [\"active\"] => bool(true)\n}\n`;
    expect(out).toBe(expected);
  });
});
