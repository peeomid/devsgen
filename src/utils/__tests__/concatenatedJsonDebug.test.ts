import { JSONValidator } from '../jsonValidator';

describe('Concatenated JSON Debug', () => {
  const singleDonutJSON = `{
  "id": "0001",
  "type": "donut",
  "name": "Cake",
  "ppu": 0.55,
  "batters": {
    "batter": [
      { "id": "1001", "type": "Regular" },
      { "id": "1002", "type": "Chocolate" },
      { "id": "1003", "type": "Blueberry" },
      { "id": "1004", "type": "Devil's Food" }
    ]
  },
  "topping": [
    { "id": "5001", "type": "None" },
    { "id": "5002", "type": "Glazed" },
    { "id": "5005", "type": "Sugar" },
    { "id": "5007", "type": "Powdered Sugar" },
    { "id": "5006", "type": "Chocolate with Sprinkles" },
    { "id": "5003", "type": "Chocolate" },
    { "id": "5004", "type": "Maple" }
  ]
}`;

  test('should show clear error for concatenated donut JSON (no auto-fix)', () => {
    // Create the exact same scenario as user experienced
    const concatenatedJSON = singleDonutJSON + singleDonutJSON;
    
    console.log('🔍 Concatenated JSON Debug:');
    console.log('Input length:', concatenatedJSON.length);
    console.log('Has concatenated pattern:', /\}\s*\{/.test(concatenatedJSON));
    console.log('First 100 chars:', concatenatedJSON.slice(0, 100));
    console.log('Split point (chars 610-630):', JSON.stringify(concatenatedJSON.slice(610, 630)));
    
    // Test the fixCommonIssues function directly
    const fixResult = JSONValidator.fixCommonIssues(concatenatedJSON);
    console.log('Fix result:');
    console.log('  Changes:', fixResult.changes);
    console.log('  Fixed length:', fixResult.fixed.length);
    console.log('  Fixed first 100 chars:', fixResult.fixed.slice(0, 100));
    console.log('  Fixed around split (chars 610-630):', JSON.stringify(fixResult.fixed.slice(610, 630)));
    
    // Try parsing the fixed version
    try {
      const parsed = JSON.parse(fixResult.fixed);
      console.log('  Manual parse successful!');
      console.log('  Is array:', Array.isArray(parsed));
      console.log('  Length:', parsed?.length);
    } catch (e) {
      console.log('  Manual parse failed:', e.message);
    }
    
    const result = JSONValidator.validate(concatenatedJSON);
    
    console.log('Validation result:');
    console.log('  Is valid:', result.isValid);
    console.log('  Error:', result.error);
    console.log('  Suggestion:', result.suggestion);
    
    if (result.isValid) {
      console.log('  Result type:', Array.isArray(result.parsed) ? 'Array' : typeof result.parsed);
      console.log('  Array length:', result.parsed?.length);
      console.log('  First item Devil\'s Food:', result.parsed?.[0]?.batters?.batter?.[3]?.type);
      console.log('  Second item Devil\'s Food:', result.parsed?.[1]?.batters?.batter?.[3]?.type);
    }
    
    // Now validation should FAIL and show clear error instead of auto-fixing
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('Extra text found after valid JSON');
    expect(result.suggestion).toContain('Remove any text that appears after the closing bracket/brace');
    expect(result.line).toBe(23);
    expect(result.column).toBe(2);
  });
  
  test('should validate single donut JSON correctly', () => {
    // Test that single valid JSON still works fine
    const result = JSONValidator.validate(singleDonutJSON);
    
    expect(result.isValid).toBe(true);
    expect(result.parsed.batters.batter[3].type).toBe("Devil's Food");
    expect(result.parsed.id).toBe("0001");
    expect(result.parsed.type).toBe("donut");
  });
});