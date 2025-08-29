import { describe, test, expect } from 'vitest';
import { beautify, detectType, suggestModeFromDetection } from '../../lib/beautify/beautify';
import type { BeautifyOptions } from '../../types/beautify';

const defaultOptions: BeautifyOptions = {
  mode: 'structure',
  indent: 2,
  useTabs: false,
  newlineAfterComma: true,
  keepComments: true,
  conservative: false,
};

describe('beautify', () => {
  test('formats JSON-like structure in structure mode', () => {
    const input = '{"name":"John","age":30,"city":"NYC"}';
    const result = beautify(input, defaultOptions);
    
    expect(result.output).toContain('{\n  "name": "John"');
    expect(result.output).toContain(',\n  "age": 30');
    expect(result.output).toContain(',\n  "city": "NYC"');
    expect(result.diagnostics.warnings).toHaveLength(0);
  });

  test('handles Python repr-like input', () => {
    const input = "{'name': 'John', 'active': True, 'data': None}";
    const result = beautify(input, defaultOptions);
    
    expect(result.output).toContain("{\n  'name': 'John'");
    expect(result.output).toContain("'active': True");
    expect(result.output).toContain("'data': None");
  });

  test('handles PHP array syntax', () => {
    const input = "array('name' => 'John', 'age' => 30)";
    const result = beautify(input, { ...defaultOptions, mode: 'phpish' });
    
    expect(result.output).toContain("array");
    // BracketFormatterService preserves original spacing around =>
    expect(result.output).toContain("'name' => 'John'");
  });

  test('preserves quotes in all modes', () => {
    const input = "{'name': 'John', 'age': 30}";
    const result = beautify(input, { ...defaultOptions, mode: 'jsonish', conservative: false });
    
    // BracketFormatterService preserves original quotes - doesn't convert them
    expect(result.output).toContain("'name': 'John'");
  });

  test('preserves original tokens in conservative mode', () => {
    const input = "{'name': 'John', 'age': 30}";
    const result = beautify(input, { ...defaultOptions, conservative: true });
    
    // Should keep original single quotes
    expect(result.output).toContain("'name': 'John'");
  });

  test('handles malformed input gracefully', () => {
    const input = '{"unclosed": "string", "missing_bracket": [1, 2, 3';
    const result = beautify(input, defaultOptions);
    
    expect(result.output).toBeDefined();
    expect(result.diagnostics.unbalancedBrackets).toBe(true);
    expect(result.diagnostics.warnings.length).toBeGreaterThan(0);
  });

  test('handles empty input', () => {
    const input = '';
    const result = beautify(input, defaultOptions);
    
    expect(result.output.trim()).toBe('');
    expect(result.diagnostics.warnings).toHaveLength(0);
  });

  test('returns processing time', () => {
    const input = '{"key": "value"}';
    const result = beautify(input, defaultOptions);
    
    expect(result.timeMs).toBeGreaterThanOrEqual(0);
  });
});

describe('detectType', () => {
  test('detects valid JSON', () => {
    const input = '{"name": "John", "age": 30}';
    const detected = detectType(input);
    
    expect(detected).toBe('json');
  });

  test('detects Python repr patterns', () => {
    const input = "{'name': 'John', 'active': True, 'data': None}";
    const detected = detectType(input);
    
    expect(detected).toBe('pythonRepr');
  });

  test('detects PHP array patterns', () => {
    const input = "array('name' => 'John', 'age' => 30)";
    const detected = detectType(input);
    
    expect(detected).toBe('phpArray');
  });

  test('detects PHP var_dump patterns', () => {
    const input = `array(2) {
      ["name"]=>
      string(4) "John"
      ["age"]=>
      int(30)
    }`;
    const detected = detectType(input);
    
    expect(detected).toBe('phpVarDump');
  });

  test('detects JSON-ish patterns', () => {
    const input = `{
      "name": "John", // comment
      "items": [1, 2, 3,], // trailing comma
    }`;
    const detected = detectType(input);
    
    expect(detected).toBe('jsonish');
  });

  test('returns unknown for unrecognized patterns', () => {
    const input = 'just some random text';
    const detected = detectType(input);
    
    expect(detected).toBe('unknown');
  });

  test('handles empty input', () => {
    const input = '';
    const detected = detectType(input);
    
    expect(detected).toBe('unknown');
  });
});

describe('suggestModeFromDetection', () => {
  test('suggests jsonish for json patterns', () => {
    expect(suggestModeFromDetection('json')).toBe('jsonish');
    expect(suggestModeFromDetection('jsonish')).toBe('jsonish');
  });

  test('suggests phpish for PHP patterns', () => {
    expect(suggestModeFromDetection('phpArray')).toBe('phpish');
    expect(suggestModeFromDetection('phpVarDump')).toBe('phpish');
  });

  test('suggests structure for Python repr', () => {
    expect(suggestModeFromDetection('pythonRepr')).toBe('structure');
  });

  test('defaults to structure for unknown', () => {
    expect(suggestModeFromDetection('unknown')).toBe('structure');
  });
});