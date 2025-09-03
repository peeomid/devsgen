import { describe, it, expect } from 'vitest';
import { beautify } from '../../beautify/beautify.ts';

describe('phpish var_dump formatting (exact case)', () => {
  it('formats the provided var_dump sample exactly', () => {
    const input = [
      'array(2) {',
      '  ["id"]=>int(42)',
      '  ["tags"]=>array(3){',
      '    [0]=>string(3)"one"[1]=>string(3)"two"[2]=>string(5)"three"',
      '  }',
      '}',
    ].join('\n');

    const result = beautify(input, {
      mode: 'phpish',
      indent: 2,
      useTabs: false,
      newlineAfterComma: true,
      keepComments: true,
      conservative: false,
    });

    const expected = [
      'array(2) {',
      '  ["id"] => int(42)',
      '  ["tags"] => array(3) {',
      '    [0] => string(3) "one"',
      '    [1] => string(3) "two"',
      '    [2] => string(5) "three"',
      '  }',
      '}',
      '',
    ].join('\n');

    expect(result.output).toBe(expected);
  });

  it('ensures proper array spacing and concatenated entry splitting', () => {
    const input = 'array(3){[0]=>string(1)"a"[1]=>int(42)[2]=>bool(true)}';
    
    const result = beautify(input, {
      mode: 'phpish',
      indent: 2,
      useTabs: false,
      newlineAfterComma: true,
      keepComments: true,
      conservative: false,
    });

    const expected = [
      'array(3) {',
      '  [0] => string(1) "a"',
      '  [1] => int(42)',
      '  [2] => bool(true)',
      '}',
      '',
    ].join('\n');

    expect(result.output).toBe(expected);
  });

  it('handles nested arrays with proper indentation', () => {
    const input = 'array(1){["nested"]=>array(2){["a"]=>int(1)["b"]=>string(4)"test"}}';
    
    const result = beautify(input, {
      mode: 'phpish',
      indent: 2,
      useTabs: false,
      newlineAfterComma: true,
      keepComments: true,
      conservative: false,
    });

    const expected = [
      'array(1) {',
      '  ["nested"] => array(2) {',
      '    ["a"] => int(1)',
      '    ["b"] => string(4) "test"',
      '  }',
      '}',
      '',
    ].join('\n');

    expect(result.output).toBe(expected);
  });
});

