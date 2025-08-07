# Regex Helper Tool - Implementation Plan

## Feature Areas

1. **Project Structure**
   - Astro site setup
   - Component organization
   - Routing configuration

2. **Data Management**
   - Pattern data schema
   - Local storage integration
   - Pattern CRUD operations
   - Textarea-based pattern import/export

3. **Core UI**
   - Input/Output areas
   - Hybrid responsive layout
   - Action controls

4. **Pattern Selection**
   - Command palette (Cmd+K)
   - Pattern selector UI
   - Search functionality

5. **Regex Processing**
   - Transformation logic
   - Validation
   - Error handling

6. **Keyboard Navigation**
   - Shortcut system
   - Focus management
   - Visual indicators

7. **User Experience**
   - Post-transform interactions
   - Visual feedback
   - Animations

8. **Accessibility**
   - ARIA attributes
   - Screen reader support
   - Keyboard accessibility

## Implementation Todos

### 0. GitHub SEO Optimization

- [ ] **Create Main README.md**
  - File: `/Users/luan/Development/Osimify/codetweak/README.md`
  - Purpose: Project overview and documentation for the entire codetweak collection
  - Implementation details:
    - Title: CodeTweak - A Collection of Developer Utilities
    - Top badges: MIT License, Built with Astro, etc.
    - Short description highlighting keyboard-focused workflow and programmer-friendly features
    - Table of contents with links to different sections
    - Features section listing all available tools (currently just Regex Helper)
    - Installation instructions with npm/yarn commands
    - Usage examples with screenshots
    - Technologies section listing the stack (Astro, TypeScript, etc.)
    - Contributing section with link to CONTRIBUTING.md
    - SEO keywords: developer tools, regex helper, keyboard shortcuts, utilities

- [ ] **Create Tool-Specific READMEs**
  - File: `/Users/luan/Development/Osimify/codetweak/tools/regex-find-replace/README.md`
  - Purpose: Detailed documentation for the Regex Helper tool that renders when browsing GitHub
  - Implementation details:
    - Title: Regex Helper - Transform Text with Regular Expressions
    - Screenshot of the tool in action
    - Description of all features with code examples
    - Link to the live tool
    - Table of built-in regex patterns with examples
    - Keyboard shortcuts table
    - Examples of common use cases (Python path conversion, list formatting)
    - Creating custom patterns tutorial
    - Clear path to local storage features
    - SEO keywords: regex tool, regular expressions, text transformation, pattern library

- [ ] **Create Contributing Guidelines**
  - File: `/Users/luan/Development/Osimify/codetweak/CONTRIBUTING.md`
  - Purpose: Documentation for contributors to the project
  - Implementation details:
    - Local development setup instructions
    - Project structure overview
    - Code style guidelines and linting setup
    - Pull request process and template
    - Testing requirements (unit tests for all new features)
    - How to add new patterns to the regex library
    - How to create new tools in the collection
    - Commit message format
    - Code of conduct reference

### 1. Project Structure

- [ ] **Initialize Astro Project**
  - File: `/Users/luan/Development/Osimify/codetweak/package.json`
  - Purpose: Set up the base project structure with all necessary dependencies
  - Implementation details:
    - Command: `npm create astro@latest`
    - Select: TypeScript (strict), with ESLint, Prettier
    - Add dependencies: `@astrojs/react` for React components integration
    - Configure scripts: dev, build, preview, lint, test
    - Set up package.json with:
      ```json
      {
        "name": "codetweak",
        "version": "0.1.0",
        "private": true,
        "scripts": {
          "dev": "astro dev",
          "start": "astro dev",
          "build": "astro build",
          "preview": "astro preview",
          "test": "vitest run",
          "test:watch": "vitest",
          "lint": "eslint src"
        },
        "dependencies": {
          "@astrojs/react": "^x.x.x",
          "react": "^18.x.x",
          "react-dom": "^18.x.x"
        },
        "devDependencies": {
          "@astrojs/tailwind": "^x.x.x",
          "astro": "^x.x.x",
          "eslint": "^8.x.x",
          "tailwindcss": "^3.x.x",
          "typescript": "^5.x.x",
          "vitest": "^x.x.x"
        }
      }
      ```

- [ ] **Configure Tailwind CSS**
  - File: `/Users/luan/Development/Osimify/codetweak/tailwind.config.js`
  - Purpose: Set up consistent styling framework with custom theme
  - Implementation details:
    - Command: `npx astro add tailwind`
    - Configure theme with custom colors matching the design:
      ```javascript
      module.exports = {
        content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
        theme: {
          extend: {
            colors: {
              primary: '#3B82F6',  // Blue
              secondary: '#6B7280', // Gray
              success: '#10B981',   // Green
              error: '#EF4444',     // Red
              background: '#F9FAFB', // Light gray
              text: '#1F2937',      // Dark gray
              accent: '#DBEAFE'      // Light blue
            },
            fontFamily: {
              mono: ['SF Mono', 'Menlo', 'monospace']
            }
          }
        },
        plugins: []
      };
      ```
    - Create a base.css file with global styles
    - Set up dark mode support with class strategy

- [ ] **Set Up Base Layout**
  - File: `/Users/luan/Development/Osimify/codetweak/src/layouts/BaseLayout.astro`
  - Purpose: Create a responsive layout template used by all pages
  - Implementation details:
    - Define HTML structure with proper meta tags and SEO attributes
    - Create slots for page content, title, and meta description
    - Include responsive viewport settings
    - Add header with navigation to different tools
    - Add footer with links and attribution
    - Include skip navigation link for accessibility
    - Add basic keyboard shortcut handler
    - Set up structured data JSON-LD for SEO
    - Example structure:
      ```astro
      ---
      // BaseLayout.astro
      import '../styles/base.css';
      
      const { title, description } = Astro.props;
      ---
      
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>{title} | CodeTweak</title>
          <meta name="description" content={description} />
          <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
          <!-- Additional SEO meta tags go here -->
        </head>
        <body class="bg-background text-text min-h-screen flex flex-col">
          <a href="#main-content" class="sr-only focus:not-sr-only">Skip to content</a>
          
          <header class="bg-white shadow-sm">
            <!-- Navigation component goes here -->
          </header>
          
          <main id="main-content" class="flex-grow container mx-auto px-4 py-8">
            <slot />
          </main>
          
          <footer class="bg-white border-t border-gray-200 py-6">
            <!-- Footer content goes here -->
          </footer>
        </body>
      </html>
      ```

- [ ] **Create Tool Page Route**
  - File: `/Users/luan/Development/Osimify/codetweak/src/pages/tools/regex-find-replace/index.astro`
  - Purpose: Main entry point for the regex tool with SEO optimizations
  - Implementation details:
    - Import BaseLayout and RegexHelperApp component
    - Set up client-side hydration for the interactive elements
    - Add SEO metadata specific to regex tool
    - Load initial pattern data from server
    - Configure client:load directive for RegexHelperApp
    - Include introductory content for SEO purposes
    - Example implementation:
      ```astro
      ---
      // tools/regex/index.astro
      import BaseLayout from '../../../layouts/BaseLayout.astro';
      import RegexHelperApp from '../../../components/regex/RegexHelperApp';
      import { getPatterns } from '../../../data/patternLoader';
      
      // Load pattern data at build time
      const patterns = await getPatterns();
      ---
      
      <BaseLayout 
        title="Regex Helper Tool" 
        description="Transform text using regular expressions with this keyboard-focused developer utility.">
        
        <h1 class="text-3xl font-bold mb-6">Regex Helper Tool</h1>
        
        <div class="prose mb-8 max-w-none">
          <p>A powerful utility for transforming text using regular expressions. Ideal for common developer tasks like converting Python paths, formatting lists, and more.</p>
        </div>
        
        <RegexHelperApp client:load initialPatterns={patterns} />
      </BaseLayout>
      ```
    - Create a [patternId].astro dynamic route page for individual patterns

### 2. Data Management

- [ ] **Define Pattern Schema**
  - File: `/Users/luan/Development/Osimify/codetweak/src/types/PatternTypes.ts`
  - Purpose: TypeScript interfaces for pattern data
  - Implementation details:
    - Create TypeScript interfaces for pattern management:
      ```typescript
      export interface Pattern {
        id: string;            // Unique identifier for the pattern
        name: string;          // Display name of the pattern
        description: string;   // Description of what the pattern does
        category: PatternCategory; // Category the pattern belongs to
        searchRegex: string;   // The search pattern (regex)
        replaceRegex: string;  // The replacement pattern
        examples?: Example[];  // Optional examples showing pattern usage
        isUserCreated?: boolean; // Whether the pattern is user-created
        createdAt?: string;    // When the pattern was created (ISO date)
        updatedAt?: string;    // When the pattern was last updated (ISO date)
      }
      
      export enum PatternCategory {
        PATH_CONVERSION = 'path-conversion',
        LIST_FORMATTING = 'list-formatting',
        CODE_TRANSFORMATION = 'code-transformation',
        TEXT_EXTRACTION = 'text-extraction',
        CUSTOM = 'custom'
      }
      
      export interface Example {
        input: string;         // Example input text
        output: string;        // Expected output text after transformation
        explanation?: string;  // Optional explanation of the transformation
      }
      ```
    - Include interfaces for state management:
      ```typescript
      export interface PatternState {
        patterns: Pattern[];          // All available patterns
        filteredPatterns: Pattern[]; // Patterns filtered by search or category
        selectedPattern: Pattern | null; // Currently selected pattern
        searchQuery: string;         // Current search query
        isLoading: boolean;          // Loading state indicator
      }
      ```

- [ ] **Create Sample Patterns**
  - File: `/Users/luan/Development/Osimify/codetweak/public/data/regex-patterns.json`
  - Purpose: Provide initial built-in patterns for the tool
  - Implementation details:
    - Create a JSON file with an array of pattern objects:
      ```json
      {
        "patterns": [
          {
            "id": "python-path-to-file",
            "name": "Python Import to File Path",
            "description": "Converts Python dot notation to file system paths",
            "category": "path-conversion",
            "searchRegex": "(\\w+)\\.(\\w+)",
            "replaceRegex": "$1/$2",
            "examples": [
              {
                "input": "app.services.user",
                "output": "app/services/user",
                "explanation": "Converts dot notation to slash notation"
              }
            ]
          },
          {
            "id": "file-path-to-python",
            "name": "File Path to Python Import",
            "description": "Converts file system paths to Python dot notation",
            "category": "path-conversion",
            "searchRegex": "(\\w+)\\/(\\w+)",
            "replaceRegex": "$1.$2",
            "examples": [
              {
                "input": "app/services/user",
                "output": "app.services.user",
                "explanation": "Converts slash notation to dot notation"
              }
            ]
          }
        ]
      }
      ```
    - Include at least 10 patterns across different categories:
      - Path conversion (Python modules, file paths)
      - List formatting (joining with commas, adding quotes)
      - Code transformation (camelCase to snake_case)
      - Text extraction (emails, URLs, dates)
    - Add multiple examples for each pattern
    - Ensure all regex patterns are valid and tested

- [ ] **Implement Pattern Store**
  - File: `/Users/luan/Development/Osimify/codetweak/src/stores/patternStore.ts`
  - Purpose: Manage pattern state and provide methods to interact with patterns
  - Implementation details:
    - Create a store using a state management library (e.g., Nanostores for Astro):
      ```typescript
      import { atom, computed, action } from 'nanostores';
      import type { Pattern, PatternState } from '../types/PatternTypes';
      import { getServerPatterns, getLocalPatterns } from '../data/patternLoader';
      
      // Initial state
      const initialState: PatternState = {
        patterns: [],
        filteredPatterns: [],
        selectedPattern: null,
        searchQuery: '',
        isLoading: false
      };
      
      // Create store
      export const patternState = atom<PatternState>(initialState);
      
      // Computed values
      export const userPatterns = computed(patternState, state => 
        state.patterns.filter(p => p.isUserCreated)
      );
      
      export const builtInPatterns = computed(patternState, state => 
        state.patterns.filter(p => !p.isUserCreated)
      );
      
      // Actions
      export const loadPatterns = action(patternState, 'loadPatterns', async (store) => {
        store.setKey('isLoading', true);
        try {
          // Load server patterns
          const serverPatterns = await getServerPatterns();
          serverPatterns.forEach(p => p.isUserCreated = false);
          
          // Load localStorage patterns
          const localPatterns = getLocalPatterns();
          localPatterns.forEach(p => p.isUserCreated = true);
          
          // Combine patterns
          const allPatterns = [...serverPatterns, ...localPatterns];
          
          store.setKey('patterns', allPatterns);
          store.setKey('filteredPatterns', allPatterns);
        } catch (error) {
          console.error('Error loading patterns:', error);
        } finally {
          store.setKey('isLoading', false);
        }
      });
      
      export const searchPatterns = action(patternState, 'searchPatterns', 
        (store, query: string) => {
          const state = store.get();
          store.setKey('searchQuery', query);
          
          if (!query.trim()) {
            store.setKey('filteredPatterns', state.patterns);
            return;
          }
          
          const lowerQuery = query.toLowerCase();
          const filtered = state.patterns.filter(pattern => 
            pattern.name.toLowerCase().includes(lowerQuery) || 
            pattern.description.toLowerCase().includes(lowerQuery) ||
            pattern.category.toLowerCase().includes(lowerQuery)
          );
          
          store.setKey('filteredPatterns', filtered);
        }
      );
      ```
    - Add methods for CRUD operations on user-created patterns
    - Include functionality to persist patterns to localStorage
    - Implement pattern search with keyboard shortcut support
    - Add methods to filter patterns by category

- [ ] **Create Pattern Storage Manager**
  - File: `/Users/luan/Development/Osimify/codetweak/src/utils/PatternStorageManager.ts`
  - Purpose: Handle localStorage operations for pattern management
  - Implementation details:
    - Create utility functions for localStorage operations:
      ```typescript
      import type { Pattern } from '../types/PatternTypes';
      
      const STORAGE_KEY = 'user-regex-patterns';
      
      const PatternStorageManager = {
        // Get user patterns from localStorage
        getPatterns: (): Pattern[] => {
          try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
          } catch (error) {
            console.error('Error getting patterns from localStorage:', error);
            return [];
          }
        },
        
        // Save a new pattern to localStorage
        savePattern: (pattern: Pattern): Pattern => {
          try {
            const patterns = PatternStorageManager.getPatterns();
            
            // Generate ID if not provided
            if (!pattern.id) {
              pattern.id = `user-${Date.now()}`;
            }
            
            // Add metadata
            pattern.isUserCreated = true;
            pattern.createdAt = new Date().toISOString();
            pattern.updatedAt = new Date().toISOString();
            
            // Add to patterns list
            patterns.push(pattern);
            
            // Save to localStorage
            localStorage.setItem(STORAGE_KEY, JSON.stringify(patterns));
            return pattern;
          } catch (error) {
            console.error('Error saving pattern to localStorage:', error);
            throw error;
          }
        },
        
        // Update an existing pattern
        updatePattern: (patternId: string, updates: Partial<Pattern>): Pattern => {
          const patterns = PatternStorageManager.getPatterns();
          const index = patterns.findIndex(p => p.id === patternId);
          
          if (index === -1) {
            throw new Error(`Pattern with ID ${patternId} not found`);
          }
          
          // Update the pattern
          patterns[index] = {
            ...patterns[index],
            ...updates,
            updatedAt: new Date().toISOString()
          };
          
          // Save to localStorage
          localStorage.setItem(STORAGE_KEY, JSON.stringify(patterns));
          return patterns[index];
        },
        
        // Delete a pattern
        deletePattern: (patternId: string): boolean => {
          const patterns = PatternStorageManager.getPatterns();
          const filteredPatterns = patterns.filter(p => p.id !== patternId);
          
          localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredPatterns));
          return true;
        },
        
        // Get exportable JSON string of user patterns
        getExportablePatterns: (): string => {
          const patterns = PatternStorageManager.getPatterns();
          return JSON.stringify({ patterns }, null, 2); // Pretty-printed JSON
        },
        
        // Import patterns from JSON string
        importPatternsFromString: (jsonString: string) => {
          try {
            // Parse JSON string
            const imported = JSON.parse(jsonString);
            
            // Validate structure
            if (!imported.patterns || !Array.isArray(imported.patterns)) {
              throw new Error('Invalid pattern format: Missing "patterns" array');
            }
            
            // Get existing patterns to avoid duplicates
            const existingPatterns = PatternStorageManager.getPatterns();
            const existingIds = new Set(existingPatterns.map(p => p.id));
            
            // Filter out duplicates
            const newPatterns = imported.patterns.filter(p => !existingIds.has(p.id));
            const allPatterns = [...existingPatterns, ...newPatterns];
            
            // Save to localStorage
            localStorage.setItem(STORAGE_KEY, JSON.stringify(allPatterns));
            
            // Return import results
            return {
              added: newPatterns.length,
              total: allPatterns.length,
              newPatterns
            };
          } catch (error) {
            console.error('Error importing patterns:', error);
            throw error;
          }
        }
      };
      
      export default PatternStorageManager;
      ```
    - Focus on textarea-based import/export instead of file uploads/downloads
    - Include validation for imported patterns
    - Implement duplicate detection for imports
    - Add error handling for all operations

- [ ] **Create Pattern Service**
  - File: `/Users/luan/Development/Osimify/codetweak/src/services/patternService.ts`
  - Purpose: Business logic for pattern operations
  - Implementation details:
    - Create service for pattern-specific operations:
      ```typescript
      import type { Pattern } from '../types/PatternTypes';
      import PatternStorageManager from '../utils/PatternStorageManager';
      import regexService from './regexService';
      
      class PatternService {
        // Validate pattern structure and regex
        public validatePattern(pattern: Partial<Pattern>): { valid: boolean; errors: string[] } {
          const errors: string[] = [];
          
          // Check required fields
          if (!pattern.name?.trim()) {
            errors.push('Pattern name is required');
          }
          
          if (!pattern.description?.trim()) {
            errors.push('Pattern description is required');
          }
          
          if (!pattern.category) {
            errors.push('Pattern category is required');
          }
          
          // Validate regex patterns
          if (!pattern.searchRegex?.trim()) {
            errors.push('Search regex is required');
          } else {
            const validation = regexService.validateRegex(pattern.searchRegex);
            if (!validation.isValid) {
              errors.push(`Search regex is invalid: ${validation.error}`);
            }
          }
          
          // Replace regex can be empty, but if provided should be valid
          if (pattern.replaceRegex && typeof pattern.replaceRegex !== 'string') {
            errors.push('Replace regex must be a string');
          }
          
          // Validate examples if provided
          if (pattern.examples && Array.isArray(pattern.examples)) {
            pattern.examples.forEach((example, index) => {
              if (!example.input) {
                errors.push(`Example ${index + 1} is missing input`);
              }
              if (!example.output) {
                errors.push(`Example ${index + 1} is missing expected output`);
              }
            });
          }
          
          return { valid: errors.length === 0, errors };
        }
        
        // Format a pattern for display or export
        public formatPattern(pattern: Pattern): Pattern {
          return {
            ...pattern,
            name: pattern.name.trim(),
            description: pattern.description.trim(),
            searchRegex: pattern.searchRegex.trim(),
            replaceRegex: pattern.replaceRegex || '',
            isUserCreated: Boolean(pattern.isUserCreated),
            updatedAt: pattern.updatedAt || new Date().toISOString()
          };
        }
        
        // Search patterns by query
        public searchPatterns(patterns: Pattern[], query: string): Pattern[] {
          if (!query.trim()) {
            return patterns;
          }
          
          const lowerQuery = query.toLowerCase();
          return patterns.filter(pattern => 
            pattern.name.toLowerCase().includes(lowerQuery) ||
            pattern.description.toLowerCase().includes(lowerQuery) ||
            pattern.category.toLowerCase().includes(lowerQuery)
          );
        }
        
        // Group patterns by category
        public groupByCategory(patterns: Pattern[]): Record<string, Pattern[]> {
          return patterns.reduce((groups, pattern) => {
            const category = pattern.category;
            if (!groups[category]) {
              groups[category] = [];
            }
            groups[category].push(pattern);
            return groups;
          }, {} as Record<string, Pattern[]>);
        }
        
        // Create a new pattern
        public async createPattern(pattern: Partial<Pattern>): Promise<{ success: boolean; pattern?: Pattern; errors?: string[] }> {
          // Validate the pattern
          const validation = this.validatePattern(pattern);
          if (!validation.valid) {
            return { success: false, errors: validation.errors };
          }
          
          // Format and save
          const formattedPattern = this.formatPattern(pattern as Pattern);
          try {
            const savedPattern = PatternStorageManager.savePattern(formattedPattern);
            return { success: true, pattern: savedPattern };
          } catch (error) {
            return { 
              success: false, 
              errors: [`Failed to save pattern: ${error instanceof Error ? error.message : String(error)}`] 
            };
          }
        }
      }
      
      // Create and export singleton
      const patternService = new PatternService();
      export default patternService;
      ```
    - Implement thorough validation for all pattern fields
    - Add methods for pattern searching and categorization
    - Create format utilities to normalize pattern data
    - Implement error handling throughout the service
    - Add integration with the storage manager for persistence

### 3. Regex Processing

- [ ] **Create Regex Service**
  - File: `/Users/luan/Development/Osimify/codetweak/src/services/regexService.ts`
  - Purpose: Core service for regex transformations and validation
  - Implementation details:
    - Create a service focused on regex operations:
      ```typescript
      // Core regex functionality - separate from pattern management
      class RegexService {
        // Store registered patterns
        private patterns: Map<string, { search: RegExp, replace: string }> = new Map();
        
        // Register a pattern for use
        public registerPattern(id: string, searchRegex: string, replaceRegex: string): boolean {
          try {
            const regex = new RegExp(searchRegex, 'g');
            this.patterns.set(id, { search: regex, replace: replaceRegex });
            return true;
          } catch (error) {
            console.error(`Error registering pattern ${id}:`, error);
            return false;
          }
        }
        
        // Transform text using a registered pattern ID
        public transform(patternId: string, input: string): string {
          const pattern = this.patterns.get(patternId);
          if (!pattern) {
            throw new Error(`Pattern '${patternId}' not found`);
          }
          
          return input.replace(pattern.search, pattern.replace);
        }
        
        // Transform text directly with provided regex
        public transformWithRegex(input: string, searchRegex: string, replaceRegex: string): string {
          try {
            const regex = new RegExp(searchRegex, 'g');
            return input.replace(regex, replaceRegex);
          } catch (error) {
            throw new Error(`Transformation error: ${error instanceof Error ? error.message : String(error)}`);
          }
        }
        
        // Validate a regex pattern
        public validateRegex(regexString: string): { isValid: boolean; error?: string } {
          try {
            new RegExp(regexString);
            return { isValid: true };
          } catch (error) {
            return { 
              isValid: false, 
              error: `Invalid regex: ${error instanceof Error ? error.message : String(error)}` 
            };
          }
        }
        
        // Test if a pattern matches input
        public testMatch(input: string, searchRegex: string): { matches: boolean; count: number } {
          try {
            const regex = new RegExp(searchRegex, 'g');
            const matches = input.match(regex);
            return {
              matches: matches !== null && matches.length > 0,
              count: matches ? matches.length : 0
            };
          } catch (error) {
            return { matches: false, count: 0 };
          }
        }
        
        // Get all matches with their positions
        public getMatches(input: string, searchRegex: string): Array<{ match: string, index: number }> {
          const results: Array<{ match: string, index: number }> = [];
          try {
            const regex = new RegExp(searchRegex, 'g');
            let match;
            while ((match = regex.exec(input)) !== null) {
              results.push({
                match: match[0],
                index: match.index
              });
            }
          } catch (error) {
            // Return empty array on error
          }
          return results;
        }
      }
      
      // Create and export singleton instance
      const regexService = new RegexService();
      export default regexService;
      ```
    - Implement methods for testing regex patterns
    - Add functions to get match statistics and positions
    - Create proper error handling for all regex operations
    - Separate the core transformation logic from pattern management
    - Add performance optimization with caching

- [ ] **Create Test Suite for Regex Service**
  - File: `/Users/luan/Development/Osimify/codetweak/src/tests/regexService.test.ts`
  - Purpose: Comprehensive testing of the core regex functionality
  - Implementation details:
    - Create test suite using Vitest or Jest:
      ```typescript
      import { describe, test, expect, beforeEach } from 'vitest';
      import regexService from '../services/regexService';
      
      describe('RegexService', () => {
        // Reset patterns before each test
        beforeEach(() => {
          // Register test patterns
          regexService.registerPattern(
            'test-path-conversion',
            '(\\w+)\\.(\\w+)',
            '$1/$2'
          );
        });
        
        describe('transform', () => {
          test('should transform using a registered pattern', () => {
            const input = 'app.services.user';
            const expected = 'app/services/user';
            expect(regexService.transform('test-path-conversion', input)).toBe(expected);
          });
          
          test('should throw when using an unregistered pattern', () => {
            expect(() => {
              regexService.transform('non-existent-pattern', 'test');
            }).toThrow();
          });
        });
        
        describe('transformWithRegex', () => {
          test('should transform using provided regex', () => {
            const input = 'Hello, world!';
            const searchRegex = 'Hello';
            const replaceRegex = 'Hi';
            expect(regexService.transformWithRegex(input, searchRegex, replaceRegex))
              .toBe('Hi, world!');
          });
          
          test('should throw on invalid regex', () => {
            expect(() => {
              regexService.transformWithRegex('test', '(invalid', 'replacement');
            }).toThrow();
          });
        });
        
        describe('validateRegex', () => {
          test('should validate correct regex', () => {
            expect(regexService.validateRegex('\\w+')).toEqual({ isValid: true });
          });
          
          test('should invalidate incorrect regex', () => {
            const result = regexService.validateRegex('(unclosed');
            expect(result.isValid).toBe(false);
            expect(result.error).toBeDefined();
          });
        });
        
        describe('performance tests', () => {
          test('should handle large inputs efficiently', () => {
            // Generate large input
            const largeInput = 'test\n'.repeat(1000);
            const searchRegex = '\\n';
            const replaceRegex = ',';
            
            // Should complete in reasonable time
            const startTime = performance.now();
            regexService.transformWithRegex(largeInput, searchRegex, replaceRegex);
            const endTime = performance.now();
            
            // Assertion based on performance expectations
            expect(endTime - startTime).toBeLessThan(100); // Should complete in under 100ms
          });
        });
      });
      ```
    - Test all core regex functions independently
    - Add tests for expected error conditions
    - Create performance tests with large inputs
    - Test edge cases like empty input/patterns
    - Add tests for pattern registration and retrieval

### 4. Core UI Components

- [ ] **Create Input Area Component**
  - File: `/Users/luan/Development/Osimify/codetweak/src/components/regex/InputArea.tsx`
  - Purpose: Text input for regex processing
  - Features: Resizable, monospace font, line numbers
  - Events: onChange, onKeyDown

- [ ] **Create Output Area Component**
  - File: `/Users/luan/Development/Osimify/codetweak/src/components/regex/OutputArea.tsx`
  - Purpose: Display transformation results
  - Features: Read-only by default, copyable, syntax highlighting
  - Events: onFocus, onCopy

- [ ] **Implement Action Buttons**
  - File: `/Users/luan/Development/Osimify/codetweak/src/components/regex/ActionButtons.tsx`
  - Purpose: Transform, copy, clear functionality
  - Features: Visual feedback, tooltips with shortcuts
  - Events: onClick, onKeyDown

- [ ] **Build Hybrid Layout Container**
  - File: `/Users/luan/Development/Osimify/codetweak/src/components/regex/RegexLayout.tsx`
  - Purpose: Responsive layout switching
  - Features: Media queries, CSS Grid/Flexbox, layout persistence
  - Breakpoints: Small (<768px), Medium (768px-1200px), Large (>1200px)

### 4. Pattern Selection and Management

- [ ] **Implement Command Palette**
  - File: `/Users/luan/Development/Osimify/codetweak/src/components/regex/CommandPalette.tsx`
  - Purpose: Cmd+K pattern search
  - Features: Keyboard navigation, fuzzy search, pattern cards
  - Events: onSearch, onSelect, onKeyDown

- [ ] **Create Pattern Selector Dropdown**
  - File: `/Users/luan/Development/Osimify/codetweak/src/components/regex/PatternSelector.tsx`
  - Purpose: Visual pattern selection
  - Features: Categorized patterns, recent patterns, pattern details
  - Adaptability: Dropdown on small screens, panel on large screens

- [ ] **Build Pattern Card Component**
  - File: `/Users/luan/Development/Osimify/codetweak/src/components/regex/PatternCard.tsx`
  - Purpose: Visual representation of pattern
  - Features: Name, description, example, edit/delete actions
  - States: Normal, selected, hover, focus
  - Visual indicator for pattern source (built-in vs. user-created)

- [ ] **Create Pattern Import/Export Components**
  - File: `/Users/luan/Development/Osimify/codetweak/src/components/regex/PatternImportExport.tsx`
  - Purpose: Import and export user patterns
  - Features:
    - Textarea for displaying JSON of user patterns
    - Copy to clipboard button for export
    - Textarea for pasting JSON to import
    - Validation of imported JSON
    - Merge handling for existing patterns

### 5. Regex Processing

- [ ] **Create Regex Processor**
  - File: `/Users/luan/Development/Osimify/codetweak/src/utils/regexProcessor.ts`
  - Purpose: Core transformation logic
  - Functions: transformText(), validateRegex(), handleErrors()
  - Features: Performance optimization for large inputs

- [ ] **Implement Regex Validator**
  - File: `/Users/luan/Development/Osimify/codetweak/src/utils/regexValidator.ts`
  - Purpose: Validate regex patterns
  - Functions: isValidRegex(), getSyntaxErrors(), suggestFixes()
  - Error handling: Detailed error messages for common mistakes

- [ ] **Build Transformation Hook**
  - File: `/Users/luan/Development/Osimify/codetweak/src/hooks/useTransformation.ts`
  - Purpose: React hook for transformation logic
  - Features: State management, error handling, performance optimization
  - Returns: { transform, result, error, isProcessing }

### 6. Keyboard Navigation

- [ ] **Create Keyboard Shortcut System**
  - File: `/Users/luan/Development/Osimify/codetweak/src/utils/keyboardShortcuts.ts`
  - Purpose: Manage keyboard shortcuts
  - Features: Register shortcuts, handle conflicts, context-aware shortcuts
  - Implementation: Event listeners with modifier key support

- [ ] **Implement Focus Management**
  - File: `/Users/luan/Development/Osimify/codetweak/src/hooks/useFocusManagement.ts`
  - Purpose: Control focus flow in the application
  - Features: Focus trapping, focus history, focus restoration
  - Functions: moveFocus(), trapFocus(), restoreFocus()

- [ ] **Add Shortcut Indicator Component**
  - File: `/Users/luan/Development/Osimify/codetweak/src/components/common/ShortcutIndicator.tsx`
  - Purpose: Visual display of available shortcuts
  - Features: Adaptive to OS (Cmd for Mac, Ctrl for Windows/Linux)
  - Styling: Subtle, non-intrusive design

### 7. User Experience

- [ ] **Implement Post-Transform Actions**
  - File: `/Users/luan/Development/Osimify/codetweak/src/components/regex/PostTransformActions.tsx`
  - Purpose: Actions after transformation
  - Features: Temporary floating copy button, focus management
  - Behavior: Appears after transform, disappears after action or timeout

- [ ] **Create Toast Notification System**
  - File: `/Users/luan/Development/Osimify/codetweak/src/components/common/Toast.tsx`
  - Purpose: Non-intrusive feedback
  - Features: Success/error/info states, auto-dismiss, action buttons
  - Animation: Smooth entrance/exit

- [ ] **Add Visual Feedback Animations**
  - File: `/Users/luan/Development/Osimify/codetweak/src/styles/animations.css`
  - Purpose: Enhance UI with subtle animations
  - Features: Transform success, copy confirmation, focus indicators
  - Implementation: CSS transitions and keyframes

### 8. Accessibility

- [ ] **Implement ARIA Attributes**
  - Files: All component files
  - Purpose: Screen reader compatibility
  - Features: aria-label, aria-live, role attributes
  - Testing: Screen reader verification

- [ ] **Create Skip Navigation**
  - File: `/Users/luan/Development/Osimify/codetweak/src/components/common/SkipNav.tsx`
  - Purpose: Accessibility for keyboard users
  - Features: Skip to main content, skip to pattern selection
  - Styling: Visible only on focus

- [ ] **Add High Contrast Mode**
  - File: `/Users/luan/Development/Osimify/codetweak/src/styles/highContrast.css`
  - Purpose: Accessibility for vision impaired users
  - Features: Increased contrast, larger text, stronger focus indicators
  - Implementation: CSS custom properties and media queries

## Testing Plan

### Unit Tests

- [ ] **Regex Processor Tests**
  - File: `/Users/luan/Development/Osimify/codetweak/src/utils/__tests__/regexProcessor.test.ts`
  - Test cases: Common transformations, edge cases, error handling
  - Coverage: All transformation functions and error handling
  - Include tests for invalid regex patterns
  - Test performance with large inputs

- [ ] **Pattern Store Tests**
  - File: `/Users/luan/Development/Osimify/codetweak/src/stores/__tests__/patternStore.test.ts`
  - Test cases: Load, save, delete, search operations
  - Test combining patterns from server and localStorage
  - Test import/export functionality with various JSON formats

- [ ] **Core Regex Service Tests**
  - File: `/Users/luan/Development/Osimify/codetweak/src/services/__tests__/regexService.test.ts`
  - Purpose: Test the core regex functionality independently of UI
  - Test cases: 
    - Python path conversion (dot to slash and vice versa)
    - List formatting with various delimiters
    - Adding quotes to strings
    - Custom pattern testing
  - Coverage: All regex pattern use cases in requirements

### Component Tests

- [ ] **Input/Output Area Tests**
  - Files: 
    - `/Users/luan/Development/Osimify/codetweak/src/components/regex/__tests__/InputArea.test.tsx`
    - `/Users/luan/Development/Osimify/codetweak/src/components/regex/__tests__/OutputArea.test.tsx`
  - Test cases: User input, resizing, copy functionality

- [ ] **Command Palette Tests**
  - File: `/Users/luan/Development/Osimify/codetweak/src/components/regex/__tests__/CommandPalette.test.tsx`
  - Test cases: Search, keyboard navigation, selection

### Integration Tests

- [ ] **Full Transformation Flow Test**
  - File: `/Users/luan/Development/Osimify/codetweak/src/integration-tests/transformationFlow.test.ts`
  - Test cases: End-to-end transformation process

- [ ] **Responsive Layout Tests**
  - File: `/Users/luan/Development/Osimify/codetweak/src/integration-tests/responsiveLayout.test.ts`
  - Test cases: Layout switching at different breakpoints

## Implementation Sequence

1. **Foundation (Days 1-3)**
   - Project structure
   - Base layout
   - Data schema
   - GitHub SEO setup with README files

2. **Core Functionality (Days 4-7)**
   - Input/Output components
   - Basic pattern selection
   - Regex processing
   - Core regex service with tests

3. **Enhanced Experience (Days 8-12)**
   - Command palette
   - Keyboard shortcuts
   - Hybrid layout
   - Pattern localStorage integration

4. **Polish & Refinement (Days 13-15)**
   - Pattern import/export via textareas
   - Animations
   - Accessibility
   - Testing & bug fixes

## Success Criteria

- [ ] All core functionality works as expected
- [ ] Hybrid layout adapts correctly to different screen sizes
- [ ] Keyboard shortcuts and Command+K palette function properly
- [ ] Patterns persist between sessions using localStorage
- [ ] Import/export of patterns via textarea works correctly
- [ ] Accessibility requirements are met
- [ ] All tests pass with good coverage of core regex functionality
- [ ] GitHub repository structure optimized for SEO with comprehensive README files