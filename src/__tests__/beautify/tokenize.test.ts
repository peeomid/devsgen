import { describe, test, expect } from 'vitest';
import { tokenize, bracketsMatch, getBracketPair } from '../../lib/beautify/tokenize';

describe('tokenize', () => {
  test('handles basic JSON structure', () => {
    const input = '{"key": "value", "array": [1, 2, 3]}';
    const tokens = tokenize(input);
    
    const openBrackets = tokens.filter(t => t.type === 'open');
    const closeBrackets = tokens.filter(t => t.type === 'close');
    
    expect(openBrackets).toHaveLength(2); // { and [
    expect(closeBrackets).toHaveLength(2); // } and ]
    expect(openBrackets[0].bracket).toBe('{');
    expect(openBrackets[1].bracket).toBe('[');
  });

  test('respects strings and ignores brackets inside them', () => {
    const input = '{"text": "This {has} [brackets] (inside)"}';
    const tokens = tokenize(input);
    
    const openBrackets = tokens.filter(t => t.type === 'open');
    const closeBrackets = tokens.filter(t => t.type === 'close');
    const strings = tokens.filter(t => t.type === 'string');
    
    expect(openBrackets).toHaveLength(1); // Only the outer {
    expect(closeBrackets).toHaveLength(1); // Only the outer }
    expect(strings).toHaveLength(2); // "text" and "This {has} [brackets] (inside)"
  });

  test('handles escaped quotes in strings', () => {
    const input = '{"key": "value with \\"escaped\\" quotes"}';
    const tokens = tokenize(input);
    
    const strings = tokens.filter(t => t.type === 'string');
    expect(strings).toHaveLength(2);
    expect(strings[1].value).toBe('"value with \\"escaped\\" quotes"');
  });

  test('handles single quotes', () => {
    const input = "{'key': 'value with single quotes'}";
    const tokens = tokenize(input);
    
    const strings = tokens.filter(t => t.type === 'string');
    expect(strings).toHaveLength(2);
    expect(strings[0].value).toBe("'key'");
    expect(strings[1].value).toBe("'value with single quotes'");
  });

  test('handles line comments', () => {
    const input = `{
      "key": "value", // this is a comment
      "other": "value"
    }`;
    const tokens = tokenize(input, { keepComments: true });
    
    const comments = tokens.filter(t => t.type === 'comment');
    expect(comments).toHaveLength(1);
    expect(comments[0].value).toBe('// this is a comment');
  });

  test('handles hash comments', () => {
    const input = `{
      "key": "value", # this is a hash comment
      "other": "value"
    }`;
    const tokens = tokenize(input, { keepComments: true });
    
    const comments = tokens.filter(t => t.type === 'comment');
    expect(comments).toHaveLength(1);
    expect(comments[0].value).toBe('# this is a hash comment');
  });

  test('handles block comments', () => {
    const input = `{
      "key": "value", /* this is a 
      block comment */
      "other": "value"
    }`;
    const tokens = tokenize(input, { keepComments: true });
    
    const comments = tokens.filter(t => t.type === 'comment');
    expect(comments).toHaveLength(1);
    expect(comments[0].value.includes('block comment')).toBe(true);
  });

  test('ignores comments when keepComments is false', () => {
    const input = `{
      "key": "value", // comment
      "other": "value" /* block */
    }`;
    const tokens = tokenize(input, { keepComments: false });
    
    const comments = tokens.filter(t => t.type === 'comment');
    expect(comments).toHaveLength(0);
  });

  test('identifies commas and colons', () => {
    const input = '{"key": "value", "array": [1, 2, 3]}';
    const tokens = tokenize(input);
    
    const commas = tokens.filter(t => t.type === 'comma');
    const colons = tokens.filter(t => t.type === 'colon');
    
    expect(commas).toHaveLength(3); // Two in object, two in array
    expect(colons).toHaveLength(2); // Two key-value pairs
  });
});

describe('bracket utilities', () => {
  test('getBracketPair returns correct pairs', () => {
    expect(getBracketPair('{')).toBe('}');
    expect(getBracketPair('[')).toBe(']');
    expect(getBracketPair('(')).toBe(')');
    expect(getBracketPair('}')).toBe('{');
    expect(getBracketPair(']')).toBe('[');
    expect(getBracketPair(')')).toBe('(');
  });

  test('bracketsMatch correctly identifies matching pairs', () => {
    expect(bracketsMatch('{', '}')).toBe(true);
    expect(bracketsMatch('[', ']')).toBe(true);
    expect(bracketsMatch('(', ')')).toBe(true);
    expect(bracketsMatch('{', ']')).toBe(false);
    expect(bracketsMatch('[', '}')).toBe(false);
    expect(bracketsMatch('(', ']')).toBe(false);
  });
});