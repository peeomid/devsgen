import { describe, it, expect } from 'vitest';
import { beautify } from '../../lib/beautify/beautify';
import type { BeautifyOptions } from '../../types/beautify';

const defaultOptions: BeautifyOptions = {
  mode: 'structure',
  indent: 2,
  useTabs: false,
  newlineAfterComma: true,
  keepComments: true,
  conservative: false,
};

describe('Beautify All Types (Regression Tests)', () => {
  describe('JSON formatting', () => {
    it('formats valid JSON', () => {
      const input = '{"name":"John","age":30,"active":true}';
      const result = beautify(input, defaultOptions);
      
      expect(result.output).toContain('{\n  "name": "John"');
      expect(result.output).toContain(',\n  "age": 30');
      expect(result.output).toContain(',\n  "active": true');
    });

    it('formats nested JSON objects', () => {
      const input = '{"user":{"name":"Alice","profile":{"age":25}}}';
      const result = beautify(input, defaultOptions);
      
      expect(result.output).toContain('{\n  "user": {');
      expect(result.output).toContain('{\n    "name": "Alice"');
      expect(result.output).toContain('{\n      "age": 25');
    });

    it('formats JSON arrays', () => {
      const input = '{"items":[1,2,3],"tags":["a","b"]}';
      const result = beautify(input, defaultOptions);
      
      expect(result.output).toContain('[1, 2, 3]');
      expect(result.output).toContain('["a", "b"]');
    });
  });

  describe('JSON-ish formatting (with comments/trailing commas)', () => {
    it('formats JSON with trailing commas', () => {
      const input = '{"a":1,"b":2,}';
      const result = beautify(input, defaultOptions);
      
      expect(result.output).toContain('{\n  "a": 1');
      expect(result.output).toContain(',\n  "b": 2');
    });

    it('handles single quotes', () => {
      const input = "{'name':'John','active':true}";
      const result = beautify(input, defaultOptions);
      
      expect(result.output).toContain("{\n  'name': 'John'");
      expect(result.output).toContain("'active': true");
    });
  });

  describe('Python repr formatting', () => {
    it('formats Python dictionaries', () => {
      const input = "{'users': [{'id': 1, 'name': 'Alice'}], 'count': 1}";
      const result = beautify(input, defaultOptions);
      
      expect(result.output).toContain("{\n  'users': [");
      expect(result.output).toContain("{\n      'id': 1"); // Nested object has more indentation
      expect(result.output).toContain("'name': 'Alice'");
    });

    it('handles Python boolean values', () => {
      const input = "{'active': True, 'deleted': False, 'data': None}";
      const result = beautify(input, defaultOptions);
      
      expect(result.output).toContain("'active': True");
      expect(result.output).toContain("'deleted': False");
      expect(result.output).toContain("'data': None");
    });

    it('formats Python tuples', () => {
      const input = "{'coordinates': (10, 20), 'colors': ('red', 'blue')}";
      const result = beautify(input, defaultOptions);
      
      expect(result.output).toContain("'coordinates': (");
      expect(result.output).toContain("'colors': (");
    });
  });

  describe('PHP array formatting', () => {
    it('formats PHP array() syntax', () => {
      const input = "array('name' => 'John', 'age' => 30, 'tags' => array('php', 'web'))";
      const result = beautify(input, defaultOptions);
      
      expect(result.output).toContain("array");
      expect(result.output).toContain("'name' => 'John'");
      expect(result.output).toContain("'tags' => array");
    });

    it('formats PHP short array syntax', () => {
      const input = "['name' => 'John', 'items' => [1, 2, 3]]";
      const result = beautify(input, defaultOptions);
      
      expect(result.output).toContain("[\n  'name' => 'John'");
      expect(result.output).toContain("'items' => [");
    });

    it('handles numeric keys', () => {
      const input = "array(0 => 'first', 1 => 'second', 'key' => 'value')";
      const result = beautify(input, defaultOptions);
      
      expect(result.output).toContain("0 => 'first'");
      expect(result.output).toContain("1 => 'second'");
      expect(result.output).toContain("'key' => 'value'");
    });
  });

  describe('Unknown/generic formatting', () => {
    it('formats generic bracket structures', () => {
      const input = '{item1,item2,nested:{a,b,c}}';
      const result = beautify(input, defaultOptions);
      
      expect(result.output).toContain('{\n  item1,');
      expect(result.output).toContain('nested: {');
    });

    it('handles mixed bracket types', () => {
      const input = '{array:[1,2],tuple:(a,b)}';
      const result = beautify(input, defaultOptions);
      
      expect(result.output).toContain('array: [');
      expect(result.output).toContain('tuple: (');
    });

    it('preserves strings with special characters', () => {
      const input = '{"text":"Hello, world!","special":"[]{},()"}';
      const result = beautify(input, defaultOptions);
      
      expect(result.output).toContain('"Hello, world!"');
      expect(result.output).toContain('"special": "[]{},()"');
    });
  });

  describe('Complex nested structures', () => {
    it('formats deeply nested objects', () => {
      const input = '{"level1":{"level2":{"level3":{"value":"deep"}}}}';
      const result = beautify(input, defaultOptions);
      
      expect(result.output).toContain('{\n  "level1": {');
      expect(result.output).toContain('{\n    "level2": {');
      expect(result.output).toContain('{\n      "level3": {');
      expect(result.output).toContain('"value": "deep"');
    });

    it('formats mixed array and object nesting', () => {
      const input = '{"items":[{"name":"item1","props":{"color":"red"}},{"name":"item2"}]}';
      const result = beautify(input, defaultOptions);
      
      expect(result.output).toContain('"items": [');
      expect(result.output).toContain('{\n      "name": "item1"');
      expect(result.output).toContain('"props": {');
    });
  });

  describe('Edge cases', () => {
    it('handles empty structures', () => {
      const input = '{"empty_obj":{},"empty_array":[],"empty_str":""}';
      const result = beautify(input, defaultOptions);
      
      expect(result.output).toContain('"empty_obj"');
      expect(result.output).toContain('"empty_array"');
      expect(result.output).toContain('"empty_str": ""');
    });

    it('handles malformed input gracefully', () => {
      const input = '{"unclosed": [1, 2, 3';
      const result = beautify(input, defaultOptions);
      
      expect(result.output).toBeDefined();
      expect(result.diagnostics.unbalancedBrackets).toBe(true);
    });

    it('handles very long strings', () => {
      const longString = 'a'.repeat(1000);
      const input = `{"long":"${longString}","short":"test"}`;
      const result = beautify(input, defaultOptions);
      
      expect(result.output).toContain(`"long": "${longString}"`);
      expect(result.output).toContain('"short": "test"');
    });
  });
});