import { JSONValidator } from '../jsonValidator';

describe('JSONValidator', () => {
  test('validates correct JSON', () => {
    const validJSON = '{"name": "test", "value": 123}';
    const result = JSONValidator.validate(validJSON);
    
    expect(result.isValid).toBe(true);
    expect(result.parsed).toEqual({ name: 'test', value: 123 });
    expect(result.error).toBeUndefined();
  });

  test('handles empty input', () => {
    const result = JSONValidator.validate('');
    
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Empty input');
    expect(result.suggestion).toBe('Please paste or upload a JSON file');
  });

  test('fixes trailing commas', () => {
    const jsonWithTrailingComma = '{"name": "test", "items": [1, 2, 3,]}';
    const result = JSONValidator.validate(jsonWithTrailingComma);
    
    expect(result.isValid).toBe(true);
    expect(result.parsed).toEqual({ name: 'test', items: [1, 2, 3] });
    expect(result.suggestion).toContain('Fixed automatically');
    expect(result.suggestion).toContain('Removed trailing commas');
  });

  test('fixes single quotes', () => {
    const jsonWithSingleQuotes = "{'name': 'test', 'value': 123}";
    const result = JSONValidator.validate(jsonWithSingleQuotes);
    
    expect(result.isValid).toBe(true);
    expect(result.parsed).toEqual({ name: 'test', value: 123 });
    expect(result.suggestion).toContain('Fixed automatically');
    expect(result.suggestion).toContain('Converted single quotes to double quotes');
  });

  test('fixes unquoted keys', () => {
    const jsonWithUnquotedKeys = '{name: "test", value: 123}';
    const result = JSONValidator.validate(jsonWithUnquotedKeys);
    
    expect(result.isValid).toBe(true);
    expect(result.parsed).toEqual({ name: 'test', value: 123 });
    expect(result.suggestion).toContain('Fixed automatically');
    expect(result.suggestion).toContain('Added quotes around unquoted object keys');
  });

  test('removes JavaScript comments', () => {
    const jsonWithComments = `{
      // This is a comment
      "name": "test", /* Another comment */
      "value": 123
    }`;
    const result = JSONValidator.validate(jsonWithComments);
    
    expect(result.isValid).toBe(true);
    expect(result.parsed).toEqual({ name: 'test', value: 123 });
    expect(result.suggestion).toContain('Fixed automatically');
    expect(result.suggestion).toContain('Removed JavaScript-style comments');
  });

  test('handles extra text after JSON', () => {
    const jsonWithExtraText = '{"name": "test"} some extra text';
    const result = JSONValidator.validate(jsonWithExtraText);
    
    expect(result.isValid).toBe(true);
    expect(result.parsed).toEqual({ name: 'test' });
    expect(result.suggestion).toContain('Fixed automatically');
    expect(result.suggestion).toContain('Removed extra text after JSON');
  });

  test('handles invalid JSON with helpful error message', () => {
    const invalidJSON = '{"name": "test",}';
    const result = JSONValidator.validate(invalidJSON);
    
    expect(result.isValid).toBe(true); // Should be fixed automatically
    expect(result.parsed).toEqual({ name: 'test' });
    expect(result.suggestion).toContain('Removed trailing commas');
  });

  test('provides helpful error for truly invalid JSON', () => {
    const invalidJSON = '{name: test';
    const result = JSONValidator.validate(invalidJSON);
    
    expect(result.isValid).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.suggestion).toBeDefined();
  });

  test('handles unexpected non-whitespace character error', () => {
    const jsonWithExtraChar = '{"valid": true}extra';
    const result = JSONValidator.validate(jsonWithExtraChar);
    
    // Should be fixed by removing extra text
    expect(result.isValid).toBe(true);
    expect(result.parsed).toEqual({ valid: true });
    expect(result.suggestion).toContain('Removed extra text after JSON');
  });

  test('handles multiple JSON objects concatenated together', () => {
    const multipleObjects = '{"name": "first"}{"name": "second"}';
    const result = JSONValidator.validate(multipleObjects);
    
    expect(result.isValid).toBe(true);
    expect(result.parsed).toEqual([{ name: 'first' }, { name: 'second' }]);
    expect(result.suggestion).toContain('Fixed automatically');
    expect(result.suggestion).toContain('Converted multiple JSON objects to array');
  });

  test('error highlighting functionality', () => {
    const highlighted = JSONValidator.highlightError('{"test": value}', 1, 10);
    expect(highlighted).toContain('>>>');
    expect(highlighted).toContain('<<<');
  });
});