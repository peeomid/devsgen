import { describe, test, expect } from 'vitest';
import { beautify } from '../../lib/beautify/beautify';
import type { BeautifyOptions } from '../../types/beautify';

describe('Python blocks indentation (minimal)', () => {
  test('adds configured indent after colon (spaces)', () => {
    const opts: BeautifyOptions = {
      mode: 'structure',
      indent: 4,
      useTabs: false,
      newlineAfterComma: true,
      keepComments: true,
      conservative: false,
    };
    const input = `def add(a,b):\nreturn a+b`;
    const out = beautify(input, opts).output;
    const expected = `def add(a, b): \n    return a+b\n`;
    expect(out).toBe(expected);
  });

  test('adds configured indent after colon (tabs)', () => {
    const opts: BeautifyOptions = {
      mode: 'structure',
      indent: 2,
      useTabs: true,
      newlineAfterComma: true,
      keepComments: true,
      conservative: false,
    };
    const input = `class T:\npass`;
    const out = beautify(input, opts).output;
    const expected = `class T: \n\tpass\n`;
    expect(out).toBe(expected);
  });

  test('replaces single-space indent with configured 4-space indent', () => {
    const opts: BeautifyOptions = {
      mode: 'structure',
      indent: 4,
      useTabs: false,
      newlineAfterComma: true,
      keepComments: true,
      conservative: false,
    };
    const input = `def f():\n return 1`;
    const out = beautify(input, opts).output;
    const expected = `def f(): \n    return 1\n`;
    expect(out).toBe(expected);
  });

  test('keeps existing 4-space indent unchanged', () => {
    const opts: BeautifyOptions = {
      mode: 'structure',
      indent: 4,
      useTabs: false,
      newlineAfterComma: true,
      keepComments: true,
      conservative: false,
    };
    const input = `def g():\n    return 2`;
    const out = beautify(input, opts).output;
    const expected = `def g(): \n    return 2\n`;
    expect(out).toBe(expected);
  });
});
