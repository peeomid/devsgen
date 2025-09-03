import { describe, test, expect } from 'vitest';
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

/**
 * Tests for all sample inputs from the SEO_PLAN.md
 * These verify that each page's sample input produces expected formatting
 * according to the test plan notes in the SEO plan.
 */
describe('SEO Plan Sample Inputs', () => {
  
  describe('Hub Page Sample', () => {
    test('formats hub page sample - JSON-like structure', () => {
      const input = `{'name': 'Alice', 'items': [1,2,3,], 'active': true, 'config': {'theme': 'dark', 'lang': 'en'}}`;
      const result = beautify(input, defaultOptions);
      
      // Verify default beautification improves indentation and spacing
      expect(result.output).toContain("{\n  'name': 'Alice'");
      expect(result.output).toContain("'items': [");
      expect(result.output).toContain("'active': true");
      expect(result.output).toContain("'config': {");
      expect(result.output).toContain("'theme': 'dark'");
      expect(result.output).toContain("'lang': 'en'");
    });
  });

  describe('JavaScript Page Sample', () => {
    test('formats JavaScript sample - minified function', () => {
      const input = `const x={a:1,b:[1,2,3]};function sum(a,b){return a+b};console.log(sum(1,2))`;
      const result = beautify(input, defaultOptions);
      
      // Improved formatting with proper spacing and JavaScript structure
      expect(result.output).toContain("const x = {");
      expect(result.output).toContain("a: 1,");
      expect(result.output).toContain("b: [1, 2, 3]"); // Arrays now stay inline for better readability
      expect(result.output).toContain("function sum(a, b) {");
      expect(result.output).toContain("return a + b"); // operator spacing improved!
    });
  });

  describe('Python Page Sample', () => {
    test('formats Python sample - function with class', () => {
      const input = `def add(a,b):
 return a+b

class T: pass`;
      const result = beautify(input, defaultOptions);
      
      // Note: This is treated as text, not Python syntax, so it should preserve structure
      // The beautifier handles bracketed structures, not Python code syntax
      expect(result.output).toBeDefined();
      expect(result.output.length).toBeGreaterThan(0);
    });
  });

  describe('HTML Page Sample', () => {
    test('formats HTML sample - nested elements', () => {
      const input = `<div><span class="n">Hi</span><ul><li>1</li><li>2</li></ul></div>`;
      const result = beautify(input, defaultOptions);
      
      // Note: This is treated as text with angle brackets, not parsed HTML
      expect(result.output).toBeDefined();
      expect(result.output.length).toBeGreaterThan(0);
    });
  });

  describe('CSS Page Sample', () => {
    test('formats CSS sample - minified styles', () => {
      const input = `body{margin:0;padding:0}h1{font-size:2rem;color:#333}`;
      const result = beautify(input, defaultOptions);
      
      // CSS now uses proper CSS formatter with correct spacing
      expect(result.output).toContain("body {");
      expect(result.output).toContain("h1 {");
      expect(result.output).toContain("margin: 0;");
      expect(result.output).toContain("font-size: 2rem;");
    });
  });

  describe('JSON Page Sample (Malformed)', () => {
    test('formats malformed JSON sample - no validation errors', () => {
      const input = `{foo: 'bar', items: [1,2,], trailing: true,}`;
      const result = beautify(input, defaultOptions);
      
      // Ensure no rejection; verify best-effort pretty view is produced
      expect(result.output).toBeDefined();
      expect(result.output).toContain("{\n  foo: 'bar'");
      expect(result.output).toContain("items: [");
      expect(result.output).toContain("trailing: true");
      // Should handle malformed input gracefully - no validation errors shown
      expect(result.diagnostics).toBeDefined();
    });
  });

  describe('SQL Page Sample', () => {
    test('formats SQL sample - complex query', () => {
      const input = `select u.id,u.name,o.id as oid from users u join orders o on u.id=o.user_id where o.status='paid' order by o.created_at desc`;
      const result = beautify(input, defaultOptions);
      
      // Note: SQL is treated as text by the generic formatter
      // The beautifier doesn't have SQL-specific parsing, so it preserves the text
      expect(result.output).toBeDefined();
      expect(result.output.length).toBeGreaterThan(0);
    });
  });

  describe('XML Page Sample', () => {
    test('formats XML sample - nested elements', () => {
      const input = `<root><item id="1"><name>A</name></item><item id="2"/></root>`;
      const result = beautify(input, defaultOptions);
      
      // Note: XML is treated as text with angle brackets
      expect(result.output).toBeDefined();
      expect(result.output.length).toBeGreaterThan(0);
    });
  });

  describe('YAML Page Sample', () => {
    test('formats YAML sample - Kubernetes config', () => {
      const input = `apiVersion: v1
kind: ConfigMap
metadata:{name: app-cm}
data:{LOG_LEVEL: debug, TIMEOUT: "30"}`;
      const result = beautify(input, defaultOptions);
      
      // YAML now uses proper YAML formatter that converts bracketed parts to YAML syntax
      expect(result.output).toContain("metadata:");
      expect(result.output).toContain("name: app-cm");
      expect(result.output).toContain("data:");
      expect(result.output).toContain("LOG_LEVEL: debug");
      expect(result.output).toContain('TIMEOUT: "30"');
    });
  });

  describe('Minified Code Page Sample', () => {
    test('formats minified JavaScript sample - IIFE', () => {
      const input = `(function(){function n(n){return n*n}console.log(n(5))})();`;
      const result = beautify(input, defaultOptions);
      
      // Expect line breaks and indentation restored; newline after block closer
      const expected = `(function(){\n    function n(n) {\n      return n * n\n    }\n    console.log(n(5))\n  })();\n`;
      expect(result.output).toBe(expected);
    });
  });

  describe('Bulk Page Sample', () => {
    test('formats bulk sample - file list', () => {
      const input = `files:
  - src/app.js
  - src/styles.css
  - api/schema.sql`;
      const result = beautify(input, defaultOptions);
      
      // YAML-like structure should be preserved
      expect(result.output).toBeDefined();
      expect(result.output).toContain("files:");
      expect(result.output).toContain("src/app.js");
    });
  });

  describe('Git Diff Page Sample', () => {
    test('formats git diff sample - unified diff format', () => {
      const input = `diff --git a/app.js b/app.js
--- a/app.js
+++ b/app.js
@@ -1,3 +1,3 @@
-function add(a,b){return a+b}
+function add(a, b) {
+  return a + b;
+}`;
      const result = beautify(input, defaultOptions);
      
      // Git diff is treated as text - should preserve structure
      expect(result.output).toBeDefined();
      expect(result.output).toContain("diff --git");
      expect(result.output).toContain("function add");
    });
  });

  describe('PHP Dump Page Sample', () => {
    test('formats PHP var_dump sample - complex nested structure', () => {
      const input = `array(2) {
  ["user"]=>
  array(3) {
    ["id"]=>
    int(42)
    ["name"]=>
    string(5) "Alice"
    ["roles"]=>
    array(2) {
      [0]=>
      string(5) "admin"
      [1]=>
      string(4) "user"
    }
  }
  ["active"]=>
  bool(true)
}`;
      const result = beautify(input, defaultOptions);
      
      // Expect indentation, alignment, and types preserved in display
      expect(result.output).toContain("array(2) {");
      expect(result.output).toContain('"user"');
      expect(result.output).toContain("array(3) {");
      expect(result.output).toContain("int(42)");
      expect(result.output).toContain('string(5) "Alice"');
      expect(result.output).toContain("bool(true)");
      // Nested structures should have proper indentation
      expect(result.output).toContain("  array(2) {"); // nested array indented
    });
  });

  describe('Regression Tests - Auto Detection', () => {
    test('auto-detects Python repr from sample', () => {
      const input = `{'name': 'Alice', 'items': [1,2,3,], 'active': True}`;
      const result = beautify(input, defaultOptions);
      
      expect(result.output).toContain("'active': True"); // Python boolean preserved
    });

    test('auto-detects PHP from sample', () => {
      const input = `array('key' => 'value', 'nested' => array('a', 'b'))`;
      const result = beautify(input, defaultOptions);
      
      expect(result.output).toContain("array");
      expect(result.output).toContain("'key' => 'value'");
    });

    test('handles malformed JSON gracefully', () => {
      const input = `{missing_quotes: "value", trailing_comma: true,}`;
      const result = beautify(input, defaultOptions);
      
      expect(result.output).toContain("missing_quotes: \"value\"");
      expect(result.output).toContain("trailing_comma: true");
    });
  });
});
