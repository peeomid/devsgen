import { describe, test, expect } from 'vitest';
import { tokenize } from '../../lib/beautify/tokenize';
import { format } from '../../lib/beautify/format';
import type { BeautifyOptions } from '../../types/beautify';

const defaultOptions: BeautifyOptions = {
  mode: 'structure',
  indent: 2,
  useTabs: false,
  newlineAfterComma: true,
  keepComments: true,
  conservative: true,
};

describe('format', () => {
  test('formats simple JSON object', () => {
    const input = '{"key":"value","other":"data"}';
    const tokens = tokenize(input);
    const result = format(tokens, defaultOptions);
    
    expect(result.output.trim()).toBe(`{
  "key": "value",
  "other": "data"
}`);
    expect(result.diagnostics.unbalancedBrackets).toBe(false);
  });

  test('formats nested structures', () => {
    const input = '{"obj":{"nested":"value"},"array":[1,2,3]}';
    const tokens = tokenize(input);
    const result = format(tokens, defaultOptions);
    
    expect(result.output).toContain('{\n  "obj"');
    expect(result.output).toContain('{\n    "nested"');
    expect(result.output).toContain('[\n    1');
    expect(result.diagnostics.unbalancedBrackets).toBe(false);
  });

  test('handles empty structures', () => {
    const input = '{"empty_obj":{},"empty_array":[]}';
    const tokens = tokenize(input);
    const result = format(tokens, defaultOptions);
    
    expect(result.output).toContain('{}');
    expect(result.output).toContain('[]');
  });

  test('detects unbalanced brackets', () => {
    const input = '{"key": "value", "unclosed": [1, 2, 3}';
    const tokens = tokenize(input);
    const result = format(tokens, defaultOptions);
    
    expect(result.diagnostics.unbalancedBrackets).toBe(true);
    expect(result.diagnostics.warnings).toContainEqual(
      expect.stringContaining('Unmatched closing bracket')
    );
  });

  test('respects indentation options', () => {
    const input = '{"key":"value"}';
    const tokens = tokenize(input);
    
    // Test with 4 spaces
    const result4 = format(tokens, { ...defaultOptions, indent: 4 });
    expect(result4.output).toContain('    "key"'); // 4 spaces
    
    // Test with tabs
    const resultTabs = format(tokens, { ...defaultOptions, useTabs: true });
    expect(resultTabs.output).toContain('\t"key"'); // tab character
  });

  test('handles newline after comma option', () => {
    const input = '{"a":"1","b":"2","c":"3"}';
    const tokens = tokenize(input);
    
    // With newlines after commas (default)
    const resultWithNewlines = format(tokens, defaultOptions);
    expect(resultWithNewlines.output.split('\n').length).toBeGreaterThan(3);
    
    // Without newlines after commas
    const resultWithoutNewlines = format(tokens, { 
      ...defaultOptions, 
      newlineAfterComma: false 
    });
    expect(resultWithoutNewlines.output).toContain('"1", "b"');
  });

  test('preserves comments when enabled', () => {
    const input = `{
      "key": "value", // comment here
      "other": "data"
    }`;
    const tokens = tokenize(input, { keepComments: true });
    const result = format(tokens, { ...defaultOptions, keepComments: true });
    
    expect(result.output).toContain('// comment here');
  });

  test('measures processing time', () => {
    const input = '{"key":"value"}';
    const tokens = tokenize(input);
    const result = format(tokens, defaultOptions);
    
    expect(result.timeMs).toBeGreaterThanOrEqual(0);
    expect(result.timeMs).toBeLessThan(1000); // Should be very fast for small input
  });

  test('handles mixed bracket types', () => {
    const input = '{"array":[1,2],"tuple":(3,4),"nested":{"deep":[5,6]}}';
    const tokens = tokenize(input);
    const result = format(tokens, defaultOptions);
    
    expect(result.output).toContain('[\n    1');
    expect(result.output).toContain('(\n    3');
    expect(result.output).toContain('{\n    "deep"');
    expect(result.diagnostics.unbalancedBrackets).toBe(false);
  });
});