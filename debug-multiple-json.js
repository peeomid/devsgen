import { JSONValidator } from './src/utils/jsonValidator.js';

const donutJSON = `{
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

// Duplicate the JSON to create the concatenated problem
const concatenatedJSON = donutJSON + donutJSON;

console.log('🔍 Testing concatenated JSON validation:');
console.log('Input length:', concatenatedJSON.length);
console.log('Has multiple objects pattern:', /\}\s*\{/.test(concatenatedJSON));

const result = JSONValidator.validate(concatenatedJSON);
console.log('Is valid:', result.isValid);
console.log('Error:', result.error);
console.log('Suggestion:', result.suggestion);

if (result.isValid) {
  console.log('✅ Validation successful!');
  console.log('Result is array:', Array.isArray(result.parsed));
  console.log('Array length:', result.parsed?.length);
} else {
  console.log('❌ Validation failed');
}