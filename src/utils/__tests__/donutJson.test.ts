import { JSONValidator } from '../jsonValidator';
import fs from 'fs';
import path from 'path';

describe('Donut JSON File Validation', () => {
  let donutJsonContent: string;

  beforeAll(() => {
    // Read the actual Untitled-11.json file
    const filePath = path.join(process.cwd(), 'Untitled-11.json');
    donutJsonContent = fs.readFileSync(filePath, 'utf8');
  });

  test('should read the donut JSON file successfully', () => {
    expect(donutJsonContent).toBeDefined();
    expect(donutJsonContent.length).toBeGreaterThan(0);
    console.log('Donut JSON content length:', donutJsonContent.length);
    console.log('First 100 characters:', donutJsonContent.slice(0, 100));
  });

  test('should validate the donut JSON with native JSON.parse', () => {
    expect(() => JSON.parse(donutJsonContent)).not.toThrow();
    
    const parsed = JSON.parse(donutJsonContent);
    expect(parsed).toBeDefined();
    expect(typeof parsed).toBe('object');
    expect(parsed.id).toBe('0001');
    expect(parsed.type).toBe('donut');
    expect(parsed.name).toBe('Cake');
    expect(Array.isArray(parsed.batters.batter)).toBe(true);
    expect(Array.isArray(parsed.topping)).toBe(true);
  });

  test('should validate the donut JSON with our JSONValidator', () => {
    const result = JSONValidator.validate(donutJsonContent);
    
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
    expect(result.parsed).toBeDefined();
    
    const parsed = result.parsed;
    expect(parsed.id).toBe('0001');
    expect(parsed.type).toBe('donut');
    expect(parsed.name).toBe('Cake');
    expect(parsed.ppu).toBe(0.55);
    expect(Array.isArray(parsed.batters.batter)).toBe(true);
    expect(parsed.batters.batter).toHaveLength(4);
    expect(Array.isArray(parsed.topping)).toBe(true);
    expect(parsed.topping).toHaveLength(7);
  });

  test('should handle the donut JSON without any auto-fixes', () => {
    const result = JSONValidator.validate(donutJsonContent);
    
    expect(result.isValid).toBe(true);
    expect(result.suggestion).toBeUndefined(); // No auto-fixes should be needed
  });

  test('should validate specific properties in the donut JSON', () => {
    const result = JSONValidator.validate(donutJsonContent);
    const parsed = result.parsed;
    
    // Test batter array
    expect(parsed.batters.batter[0]).toEqual({ id: '1001', type: 'Regular' });
    expect(parsed.batters.batter[1]).toEqual({ id: '1002', type: 'Chocolate' });
    expect(parsed.batters.batter[2]).toEqual({ id: '1003', type: 'Blueberry' });
    expect(parsed.batters.batter[3]).toEqual({ id: '1004', type: "Devil's Food" });
    
    // Test topping array
    expect(parsed.topping[0]).toEqual({ id: '5001', type: 'None' });
    expect(parsed.topping[1]).toEqual({ id: '5002', type: 'Glazed' });
    expect(parsed.topping[6]).toEqual({ id: '5004', type: 'Maple' });
  });

  test('should handle the apostrophe in "Devil\'s Food" correctly', () => {
    const result = JSONValidator.validate(donutJsonContent);
    const parsed = result.parsed;
    
    const devilsFood = parsed.batters.batter.find((b: any) => b.type === "Devil's Food");
    expect(devilsFood).toBeDefined();
    expect(devilsFood.id).toBe('1004');
    expect(devilsFood.type).toBe("Devil's Food");
  });

  test('should validate the JSON structure matches expected schema', () => {
    const result = JSONValidator.validate(donutJsonContent);
    const parsed = result.parsed;
    
    // Validate required top-level properties
    expect(parsed).toHaveProperty('id');
    expect(parsed).toHaveProperty('type');
    expect(parsed).toHaveProperty('name');
    expect(parsed).toHaveProperty('ppu');
    expect(parsed).toHaveProperty('batters');
    expect(parsed).toHaveProperty('topping');
    
    // Validate batters structure
    expect(parsed.batters).toHaveProperty('batter');
    expect(Array.isArray(parsed.batters.batter)).toBe(true);
    
    // Validate each batter has required properties
    parsed.batters.batter.forEach((batter: any) => {
      expect(batter).toHaveProperty('id');
      expect(batter).toHaveProperty('type');
      expect(typeof batter.id).toBe('string');
      expect(typeof batter.type).toBe('string');
    });
    
    // Validate each topping has required properties
    parsed.topping.forEach((topping: any) => {
      expect(topping).toHaveProperty('id');
      expect(topping).toHaveProperty('type');
      expect(typeof topping.id).toBe('string');
      expect(typeof topping.type).toBe('string');
    });
  });
});