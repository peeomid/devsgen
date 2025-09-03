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

describe('YAML Complete Output', () => {
  test('expands inline maps to block mapping with indent', () => {
    const input = `apiVersion: v1\nkind: ConfigMap\nmetadata:{name: app-cm}\ndata:{LOG_LEVEL: debug, TIMEOUT: "30"}`;
    const expected = `apiVersion: v1\nkind: ConfigMap\nmetadata:\n  name: app-cm\ndata:\n  LOG_LEVEL: debug\n  TIMEOUT: "30"\n`;
    const out = beautify(input, opts).output;
    expect(out).toBe(expected);
  });
});

