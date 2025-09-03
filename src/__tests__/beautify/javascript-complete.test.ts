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

describe('JavaScript Complete Output Tests', () => {
  
  test('JavaScript sample should produce ideal formatting', () => {
    const input = `const x={a:1,b:[1,2,3]};function sum(a,b){return a+b};console.log(sum(1,2))`;
    const result = beautify(input, defaultOptions);
    
    const expectedOutput = `const x = {
  a: 1,
  b: [1, 2, 3]
};

function sum(a, b) {
  return a + b
};

console.log(sum(1, 2))
`;
    
    console.log('ACTUAL OUTPUT:');
    console.log(JSON.stringify(result.output));
    console.log('\nEXPECTED OUTPUT:');
    console.log(JSON.stringify(expectedOutput));
    
    expect(result.output.trim()).toBe(expectedOutput.trim());
  });

  test('Simple object should format properly', () => {
    const input = `{name:'John',age:30}`;
    const result = beautify(input, defaultOptions);
    
    const expectedOutput = `{
  name: 'John',
  age: 30
}
`;
    
    console.log('ACTUAL OUTPUT:');
    console.log(JSON.stringify(result.output));
    console.log('\nEXPECTED OUTPUT:');
    console.log(JSON.stringify(expectedOutput));
    
    expect(result.output.trim()).toBe(expectedOutput.trim());
  });

  test('Simple array should stay inline', () => {
    const input = `[1,2,3,4]`;
    const result = beautify(input, defaultOptions);
    
    const expectedOutput = `[1, 2, 3, 4]
`;
    
    console.log('ACTUAL OUTPUT:');
    console.log(JSON.stringify(result.output));
    console.log('\nEXPECTED OUTPUT:');
    console.log(JSON.stringify(expectedOutput));
    
    expect(result.output.trim()).toBe(expectedOutput.trim());
  });

  test('Function call should stay inline', () => {
    const input = `console.log(a,b,c)`;
    const result = beautify(input, defaultOptions);
    
    const expectedOutput = `console.log(a, b, c)
`;
    
    console.log('ACTUAL OUTPUT:');
    console.log(JSON.stringify(result.output));
    console.log('\nEXPECTED OUTPUT:');
    console.log(JSON.stringify(expectedOutput));
    
    expect(result.output.trim()).toBe(expectedOutput.trim());
  });
});