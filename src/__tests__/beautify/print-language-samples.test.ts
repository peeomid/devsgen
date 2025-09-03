import { describe, test } from 'vitest';
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

function logSample(name: string, input: string) {
  const { output } = beautify(input, opts);
  // Print a clear, copyable block per sample
  console.log(`\n===== ${name} INPUT =====\n${input}\n----- ${name} OUTPUT -----\n${output}===== END ${name} =====\n`);
}

describe('Print current outputs for language samples', () => {
  test('JavaScript', () => {
    logSample('JavaScript', `const x={a:1,b:[1,2,3]};function sum(a,b){return a+b};console.log(sum(1,2))`);
  });

  test('Python', () => {
    logSample('Python', `def add(a,b):\n return a+b\n\nclass T: pass`);
  });

  test('HTML', () => {
    logSample('HTML', `<div><span class="n">Hi</span><ul><li>1</li><li>2</li></ul></div>`);
  });

  test('CSS', () => {
    logSample('CSS', `body{margin:0;padding:0}h1{font-size:2rem;color:#333}`);
  });

  test('JSON (malformed, no validation)', () => {
    logSample('JSON', `{foo: 'bar', items: [1,2,], trailing: true,}`);
  });

  test('SQL', () => {
    logSample('SQL', `select u.id,u.name,o.id as oid from users u join orders o on u.id=o.user_id where o.status='paid' order by o.created_at desc`);
  });

  test('XML', () => {
    logSample('XML', `<root><item id="1"><name>A</name></item><item id="2"/></root>`);
  });

  test('YAML', () => {
    logSample('YAML', `apiVersion: v1\nkind: ConfigMap\nmetadata:{name: app-cm}\ndata:{LOG_LEVEL: debug, TIMEOUT: "30"}`);
  });

  test('PHP Dump', () => {
    logSample('PHP Dump', `array(2) {\n  ["user"]=>\n  array(3) {\n    ["id"]=>\n    int(42)\n    ["name"]=>\n    string(5) "Alice"\n    ["roles"]=>\n    array(2) {\n      [0]=>\n      string(5) "admin"\n      [1]=>\n      string(4) "user"\n    }\n  }\n  ["active"]=>\n  bool(true)\n}`);
  });
});

