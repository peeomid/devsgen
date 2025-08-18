import { JSONValidator } from '../jsonValidator';
import fs from 'fs';
import path from 'path';

describe('Donut JSON Debug Analysis', () => {
  let donutJsonContent: string;

  beforeAll(() => {
    const filePath = path.join(process.cwd(), 'Untitled-11.json');
    donutJsonContent = fs.readFileSync(filePath, 'utf8');
  });

  test('should analyze the exact character content of the donut JSON', () => {
    console.log('🔍 Donut JSON Analysis:');
    console.log('📏 Content length:', donutJsonContent.length);
    console.log('📝 First 50 chars:', JSON.stringify(donutJsonContent.slice(0, 50)));
    console.log('📝 Last 50 chars:', JSON.stringify(donutJsonContent.slice(-50)));
    
    // Check for hidden characters
    const hasCarriageReturn = donutJsonContent.includes('\r');
    const hasNonPrintable = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/.test(donutJsonContent);
    const hasBOM = donutJsonContent.charCodeAt(0) === 0xFEFF;
    
    console.log('🔍 Character analysis:');
    console.log('  - Has carriage returns (\\r):', hasCarriageReturn);
    console.log('  - Has non-printable chars:', hasNonPrintable);
    console.log('  - Has BOM:', hasBOM);
    
    // Show each line separately
    const lines = donutJsonContent.split('\n');
    console.log('📄 Total lines:', lines.length);
    lines.forEach((line, i) => {
      if (line.trim()) {
        console.log(`  Line ${i + 1}: ${JSON.stringify(line)}`);
      }
    });
    
    // Test various validation scenarios
    console.log('🧪 Validation tests:');
    
    // Test 1: Original content
    const result1 = JSONValidator.validate(donutJsonContent);
    console.log('  Original content valid:', result1.isValid);
    if (!result1.isValid) {
      console.log('  Error:', result1.error);
      console.log('  Suggestion:', result1.suggestion);
    }
    
    // Test 2: Trimmed content
    const trimmed = donutJsonContent.trim();
    const result2 = JSONValidator.validate(trimmed);
    console.log('  Trimmed content valid:', result2.isValid);
    
    // Test 3: Content with normalized line endings
    const normalized = donutJsonContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const result3 = JSONValidator.validate(normalized);
    console.log('  Normalized line endings valid:', result3.isValid);
    
    // Test 4: Content without BOM
    const withoutBOM = donutJsonContent.replace(/^\uFEFF/, '');
    const result4 = JSONValidator.validate(withoutBOM);
    console.log('  Without BOM valid:', result4.isValid);
    
    expect(result1.isValid).toBe(true);
  });

  test('should validate Devil\'s Food specifically', () => {
    const result = JSONValidator.validate(donutJsonContent);
    expect(result.isValid).toBe(true);
    
    const parsed = result.parsed;
    const devilsFood = parsed.batters.batter.find((b: any) => b.type === "Devil's Food");
    
    console.log('👹 Devil\'s Food analysis:');
    console.log('  Found:', !!devilsFood);
    console.log('  ID:', devilsFood?.id);
    console.log('  Type:', JSON.stringify(devilsFood?.type));
    console.log('  Type char codes:', devilsFood?.type.split('').map((c: string) => c.charCodeAt(0)));
    
    expect(devilsFood).toBeDefined();
    expect(devilsFood.type).toBe("Devil's Food");
  });

  test('should test manual paste simulation', () => {
    // Simulate what happens when someone copies and pastes
    const copied = donutJsonContent; // This is what would be copied
    
    // Test with potential clipboard modifications
    const scenarios = [
      { name: 'Original', content: copied },
      { name: 'Trimmed', content: copied.trim() },
      { name: 'Windows line endings', content: copied.replace(/\n/g, '\r\n') },
      { name: 'Mac line endings', content: copied.replace(/\n/g, '\r') },
      { name: 'With BOM', content: '\uFEFF' + copied },
      { name: 'Double spaced', content: copied.replace(/\n/g, '\n\n') },
    ];
    
    console.log('📋 Clipboard simulation tests:');
    scenarios.forEach(scenario => {
      const result = JSONValidator.validate(scenario.content);
      console.log(`  ${scenario.name}: ${result.isValid ? '✅ Valid' : '❌ Invalid'}`);
      if (!result.isValid) {
        console.log(`    Error: ${result.error}`);
        console.log(`    Suggestion: ${result.suggestion}`);
      }
    });
  });
});