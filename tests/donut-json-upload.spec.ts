import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Donut JSON File Upload', () => {
  test('should successfully upload and display the donut JSON file', async ({ page }) => {
    // Navigate to JSON viewer tool
    await page.goto('http://localhost:4321/tools/json-viewer/');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check the initial state
    await expect(page.locator('h1')).toContainText('JSON Viewer');
    
    // Get the file path
    const filePath = path.join(process.cwd(), 'Untitled-11.json');
    
    // Upload the donut JSON file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);
    
    // Wait for processing to complete
    await page.waitForSelector('[data-testid="json-tree"], .json-viewer', { timeout: 10000 });
    
    // Verify the JSON was loaded successfully
    const jsonViewer = page.locator('[data-testid="json-tree"], .json-viewer').first();
    await expect(jsonViewer).toBeVisible();
    
    // Check for specific content from the donut JSON
    await expect(page.locator('text="id"')).toBeVisible();
    await expect(page.locator('text="0001"')).toBeVisible();
    await expect(page.locator('text="donut"')).toBeVisible();
    await expect(page.locator('text="Cake"')).toBeVisible();
    await expect(page.locator('text="Devil\'s Food"')).toBeVisible();
    
    // Verify the structure is displayed correctly
    await expect(page.locator('text="batters"')).toBeVisible();
    await expect(page.locator('text="topping"')).toBeVisible();
    
    // Check that the arrays are displayed
    await expect(page.locator('text="batter"')).toBeVisible();
    
    console.log('✅ Donut JSON file uploaded and displayed successfully');
  });

  test('should handle manual text paste of donut JSON', async ({ page }) => {
    // Navigate to JSON viewer tool
    await page.goto('http://localhost:4321/tools/json-viewer/');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Read the donut JSON content
    const fs = require('fs');
    const filePath = path.join(process.cwd(), 'Untitled-11.json');
    const donutJson = fs.readFileSync(filePath, 'utf8');
    
    // Find the textarea and paste the JSON
    const textarea = page.locator('textarea');
    await textarea.fill(donutJson);
    
    // Wait for validation
    await page.waitForTimeout(500);
    
    // Check that validation shows success
    await expect(page.locator('text="Valid JSON"')).toBeVisible();
    await expect(page.locator('text="Object"')).toBeVisible();
    
    // Click the Load JSON button
    const loadButton = page.locator('button', { hasText: 'Load JSON' });
    await expect(loadButton).toBeEnabled();
    await loadButton.click();
    
    // Wait for the JSON to be processed and displayed
    await page.waitForSelector('[data-testid="json-tree"], .json-viewer', { timeout: 10000 });
    
    // Verify the JSON was loaded successfully
    const jsonViewer = page.locator('[data-testid="json-tree"], .json-viewer').first();
    await expect(jsonViewer).toBeVisible();
    
    // Check for specific content from the donut JSON
    await expect(page.locator('text="id"')).toBeVisible();
    await expect(page.locator('text="0001"')).toBeVisible();
    await expect(page.locator('text="donut"')).toBeVisible();
    await expect(page.locator('text="Cake"')).toBeVisible();
    await expect(page.locator('text="Devil\'s Food"')).toBeVisible();
    
    console.log('✅ Donut JSON pasted manually and displayed successfully');
  });

  test('should show proper validation feedback during text input', async ({ page }) => {
    // Navigate to JSON viewer tool
    await page.goto('http://localhost:4321/tools/json-viewer/');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Read the donut JSON content
    const fs = require('fs');
    const filePath = path.join(process.cwd(), 'Untitled-11.json');
    const donutJson = fs.readFileSync(filePath, 'utf8');
    
    // Find the textarea
    const textarea = page.locator('textarea');
    
    // Start typing incomplete JSON to test validation
    await textarea.fill('{');
    await page.waitForTimeout(300);
    
    // Should show invalid JSON state
    await expect(page.locator('text="Invalid JSON"')).toBeVisible();
    
    // Complete the JSON
    await textarea.fill(donutJson);
    await page.waitForTimeout(500);
    
    // Should show valid JSON state
    await expect(page.locator('text="Valid JSON"')).toBeVisible();
    await expect(page.locator('text="1KB"')).toBeVisible();
    await expect(page.locator('text="Object"')).toBeVisible();
    await expect(page.locator('text="15 objects"')).toBeVisible();
    
    // Load button should be enabled
    const loadButton = page.locator('button', { hasText: 'Load JSON' });
    await expect(loadButton).toBeEnabled();
    
    console.log('✅ Validation feedback works correctly during text input');
  });

  test('should handle the specific apostrophe character correctly', async ({ page }) => {
    // Navigate to JSON viewer tool
    await page.goto('http://localhost:4321/tools/json-viewer/');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Read the donut JSON content
    const fs = require('fs');
    const filePath = path.join(process.cwd(), 'Untitled-11.json');
    const donutJson = fs.readFileSync(filePath, 'utf8');
    
    // Paste the JSON
    const textarea = page.locator('textarea');
    await textarea.fill(donutJson);
    
    // Wait for validation
    await page.waitForTimeout(500);
    
    // Should be valid (apostrophe should not cause issues)
    await expect(page.locator('text="Valid JSON"')).toBeVisible();
    
    // Load the JSON
    const loadButton = page.locator('button', { hasText: 'Load JSON' });
    await loadButton.click();
    
    // Wait for processing
    await page.waitForSelector('[data-testid="json-tree"], .json-viewer', { timeout: 10000 });
    
    // Specifically check that "Devil's Food" is displayed correctly
    await expect(page.locator('text="Devil\'s Food"')).toBeVisible();
    
    // Verify no validation errors about the apostrophe
    await expect(page.locator('text="error"')).not.toBeVisible();
    await expect(page.locator('text="invalid"')).not.toBeVisible();
    
    console.log('✅ Apostrophe in "Devil\'s Food" handled correctly');
  });
});