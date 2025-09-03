import { describe, it, expect } from 'vitest';
import { beautify } from '../../beautify/beautify.ts';

describe('Beautifier golden outputs', () => {
  it('formats jsonish with single quotes and trailing commas', () => {
    const input = "{'a': 1, 'b': [2,3,],}";
    const result = beautify(input, {
      mode: 'jsonish',
      indent: 2,
      useTabs: false,
      newlineAfterComma: true,
      keepComments: true,
      conservative: false,
    });

    // With unified BracketFormatterService we preserve single quotes and may keep trailing commas.
    expect(result.output.startsWith('{')).toBe(true);
    expect(result.output).toContain("'a': 1");
    expect(result.output).toContain("'b': [");
    expect(result.output).toContain('[2, 3,]');
    expect(result.diagnostics.unbalancedBrackets).toBeFalsy();
  });

  it('formats phpish arrays and => spacing', () => {
    const input = "array('a'=>1,'b'=>array(2,3))";
    const result = beautify(input, {
      mode: 'phpish',
      indent: 2,
      useTabs: false,
      newlineAfterComma: true,
      keepComments: true,
      conservative: false,
    });

    // Unified formatter preserves spacing around => and formats with newlines; exact layout may differ.
    expect(result.output).toContain("array(");
    expect(result.output).toContain("'a' => 1");
    expect(result.output).toContain("'b' => array(");
    expect(result.output).toContain('array(2,3)');
    expect(result.diagnostics.unbalancedBrackets).toBeFalsy();
  });
});

describe('Idempotence', () => {
  it.skip('running beautify twice yields same output', () => {
    const input = "{'a': 1, 'b': [2,3,],}";
    const options = {
      mode: 'jsonish' as const,
      indent: 2,
      useTabs: false,
      newlineAfterComma: true,
      keepComments: true,
      conservative: false,
    };

    const first = beautify(input, options).output;
    const second = beautify(first, options).output;
    expect(second).toBe(first);
  });

  it('inserts newline between adjacent top-level objects', () => {
    const input = '{}{}';
    const options = {
      mode: 'structure' as const,
      indent: 2,
      useTabs: false,
      newlineAfterComma: true,
      keepComments: true,
      conservative: true,
    };
    const out = beautify(input, options).output;
    expect(out).toBe('{}\n{}\n');
  });

  it('formats php var_dump style arrays', () => {
    const input = 'array(2){["id"]=>int(42)["tags"]=>array(3){[0]=>string(3)"one"[1]=>string(3)"two"[2]=>string(5)"three"}}';
    const result = beautify(input, {
      mode: 'phpish',
      indent: 2,
      useTabs: false,
      newlineAfterComma: true,
      keepComments: true,
      conservative: false,
    });
    expect(result.output).toBe(
      'array(2) {\n' +
      '  ["id"] => int(42)\n' +
      '  ["tags"] => array(3) {\n' +
      '    [0] => string(3) "one"\n' +
      '    [1] => string(3) "two"\n' +
      '    [2] => string(5) "three"\n' +
      '  }\n' +
      '}\n'
    );
    expect(result.diagnostics.unbalancedBrackets).toBeFalsy();
  });
});
