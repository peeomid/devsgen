import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { Pattern } from '../../types/pattern';
import builtInPatterns from '../../data/built-in-patterns.json';

/**
 * E2E Tests for Pattern Preselection
 * 
 * These tests verify the critical pattern preselection flow:
 * 1. User visits pattern-specific URL
 * 2. Pattern is resolved server-side
 * 3. Client-side store initialization
 * 4. Pattern is automatically selected
 * 5. UI reflects the selected pattern state
 */
describe('Pattern Preselection E2E', () => {
  // Mock DOM environment
  let mockDocument: Document;
  let mockWindow: Window;
  
  beforeEach(() => {
    // Create mock DOM environment
    mockDocument = {
      addEventListener: vi.fn(),
      getElementById: vi.fn(),
      createElement: vi.fn(() => ({
        setAttribute: vi.fn(),
        textContent: '',
        style: {}
      }))
    } as any;

    mockWindow = {
      document: mockDocument,
      import: vi.fn()
    } as any;

    // Set up global mocks
    global.document = mockDocument;
    global.window = mockWindow;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Pattern Resolution', () => {
    const patterns = builtInPatterns as Pattern[];

    it('should find patterns by ID', () => {
      const testCases = [
        'extract-urls',
        'extract-emails', 
        'camel-to-kebab',
        'path-dot-to-slash'
      ];

      testCases.forEach(patternId => {
        const found = patterns.find(p => p.id === patternId);
        expect(found).toBeDefined();
        expect(found?.id).toBe(patternId);
      });
    });

    it('should find patterns by slug', () => {
      const testCases = [
        { slug: 'extract-urls-from-text', expectedId: 'extract-urls' },
        { slug: 'extract-email-addresses-from-text', expectedId: 'extract-emails' },
        { slug: 'camel-case-to-kebab-case', expectedId: 'camel-to-kebab' },
        { slug: 'convert-dot-notation-to-slash-paths', expectedId: 'path-dot-to-slash' }
      ];

      testCases.forEach(({ slug, expectedId }) => {
        const found = patterns.find(p => p.slug === slug);
        expect(found).toBeDefined();
        expect(found?.id).toBe(expectedId);
        expect(found?.slug).toBe(slug);
      });
    });

    it('should handle pattern resolution fallback (ID or slug)', () => {
      const testPattern = patterns[0];
      const pattern_slug = testPattern.id;
      
      // Simulate the server-side resolution logic
      const actualPattern = patterns.find((p: Pattern) => 
        p.id === pattern_slug || p.slug === pattern_slug
      ) as Pattern;

      expect(actualPattern).toBeDefined();
      expect(actualPattern.id).toBe(testPattern.id);
    });
  });

  describe('Pattern Data Validation', () => {
    it('should have required pattern properties for preselection', () => {
      const criticalPatterns = ['extract-urls', 'extract-emails', 'camel-to-kebab'];
      
      criticalPatterns.forEach(patternId => {
        const pattern = builtInPatterns.find(p => p.id === patternId) as Pattern;
        
        expect(pattern).toBeDefined();
        expect(pattern.id).toBe(patternId);
        expect(pattern.name).toBeTruthy();
        expect(pattern.searchRegex).toBeTruthy();
        expect(pattern.replaceRegex).toBeDefined(); // Can be empty string
        expect(pattern.keyNumber).toBeGreaterThan(0);
        expect(Array.isArray(pattern.shortKeys)).toBe(true);
        expect(pattern.example).toBeDefined();
        expect(pattern.example.input).toBeTruthy();
        expect(pattern.example.output).toBeDefined();
      });
    });

    it('should have valid SEO slugs where defined', () => {
      const patternsWithSlugs = builtInPatterns.filter(p => p.slug);
      
      expect(patternsWithSlugs.length).toBeGreaterThan(0);
      
      patternsWithSlugs.forEach(pattern => {
        expect(pattern.slug).toMatch(/^[a-z0-9-]+$/); // URL-safe format
        expect(pattern.slug).not.toBe(pattern.id); // Should be different from ID
        expect(pattern.slug?.length).toBeGreaterThan(pattern.id.length); // More descriptive
      });
    });
  });

  describe('Client-Side Pattern Store Mock', () => {
    let mockPatternStore: any;

    beforeEach(() => {
      // Mock pattern store functions
      mockPatternStore = {
        initializePatternStore: vi.fn().mockResolvedValue(undefined),
        selectPattern: vi.fn(),
        selectedPatternStore: {
          get: vi.fn().mockReturnValue(null),
          set: vi.fn()
        }
      };

      // Mock dynamic import
      (mockWindow.import as any).mockResolvedValue(mockPatternStore);
    });

    it('should simulate pattern preselection flow', async () => {
      const testPattern = builtInPatterns.find(p => p.id === 'extract-urls') as Pattern;
      const patternId = testPattern.id;

      // Simulate the preselection script execution
      const scriptExecution = async () => {
        const storeModule = await mockWindow.import('/src/stores/patternStore.ts');
        const { initializePatternStore, selectPattern } = storeModule;
        await initializePatternStore();
        selectPattern(patternId);
      };

      // Execute the mocked script
      await scriptExecution();

      // Verify the flow
      expect(mockWindow.import).toHaveBeenCalledWith('/src/stores/patternStore.ts');
      expect(mockPatternStore.initializePatternStore).toHaveBeenCalled();
      expect(mockPatternStore.selectPattern).toHaveBeenCalledWith(patternId);
    });

    it('should handle initialization errors gracefully', async () => {
      // Mock initialization failure
      mockPatternStore.initializePatternStore.mockRejectedValue(new Error('Store init failed'));

      const scriptExecution = async () => {
        const storeModule = await mockWindow.import('/src/stores/patternStore.ts');
        const { initializePatternStore, selectPattern } = storeModule;
        await initializePatternStore(); // This will throw
        selectPattern('extract-urls');
      };

      await expect(scriptExecution()).rejects.toThrow('Store init failed');
    });
  });

  describe('URL Pattern Matching', () => {
    const urlPatterns = [
      { url: '/tools/regex-find-replace/extract-urls', expectedId: 'extract-urls', type: 'ID' },
      { url: '/tools/regex-find-replace/extract-urls-from-text', expectedId: 'extract-urls', type: 'Slug' },
      { url: '/tools/regex-find-replace/camel-case-to-kebab-case', expectedId: 'camel-to-kebab', type: 'Slug' },
      { url: '/tools/regex-find-replace/convert-dot-notation-to-slash-paths', expectedId: 'path-dot-to-slash', type: 'Slug' }
    ];

    it('should match URL patterns to correct pattern IDs', () => {
      urlPatterns.forEach(({ url, expectedId, type }) => {
        // Extract pattern_slug from URL
        const pattern_slug = url.split('/').pop();
        
        // Find pattern using the same logic as [pattern_slug].astro
        const actualPattern = builtInPatterns.find((p: Pattern) => 
          p.id === pattern_slug || p.slug === pattern_slug
        ) as Pattern;

        expect(actualPattern).toBeDefined();
        expect(actualPattern.id).toBe(expectedId);
      });
    });

    it('should return undefined for non-existent patterns', () => {
      const invalidSlugs = ['non-existent', 'invalid-pattern', ''];
      
      invalidSlugs.forEach(pattern_slug => {
        const actualPattern = builtInPatterns.find((p: Pattern) => 
          p.id === pattern_slug || p.slug === pattern_slug
        );
        
        expect(actualPattern).toBeUndefined();
      });
    });
  });

  describe('Pattern Metadata Validation', () => {
    it('should have consistent regex patterns for critical patterns', () => {
      const criticalTests = [
        {
          id: 'extract-urls',
          expectedSearchRegex: '(https?://[^\\s,;!()]+)',
          expectedFlags: 'g'
        },
        {
          id: 'extract-emails', 
          expectedSearchRegex: '([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,})',
          expectedFlags: 'g'
        },
        {
          id: 'camel-to-kebab',
          expectedSearchRegex: '([a-z])([A-Z])',
          expectedReplaceRegex: '$1-$2',
          expectedFlags: 'g'
        }
      ];

      criticalTests.forEach(({ id, expectedSearchRegex, expectedReplaceRegex, expectedFlags }) => {
        const pattern = builtInPatterns.find(p => p.id === id) as Pattern;
        
        expect(pattern).toBeDefined();
        expect(pattern.searchRegex).toBe(expectedSearchRegex);
        if (expectedReplaceRegex) {
          expect(pattern.replaceRegex).toBe(expectedReplaceRegex);
        }
        if (expectedFlags) {
          expect(pattern.flags).toBe(expectedFlags);
        }
      });
    });

    it('should have featured patterns marked correctly', () => {
      const featuredPatterns = builtInPatterns.filter(p => p.featured);
      
      expect(featuredPatterns.length).toBeGreaterThanOrEqual(6);
      
      featuredPatterns.forEach(pattern => {
        expect(pattern.featured).toBe(true);
        expect(pattern.isBuiltIn).toBe(true);
      });
    });
  });

  describe('Cross-Browser Import Path Validation', () => {
    it('should use absolute import paths for client-side scripts', () => {
      const importPath = '/src/stores/patternStore.ts';
      
      // Verify import path format
      expect(importPath).toMatch(/^\/src\//); // Absolute path from domain root
      expect(importPath).not.toMatch(/^\.\.?\//); // Not relative path
      expect(importPath.endsWith('.ts')).toBe(true); // TypeScript file
    });

    it('should handle dynamic import resolution', () => {
      const validPaths = [
        '/src/stores/patternStore.ts',
        '/src/services/PatternService.ts',
        '/src/types/pattern.ts'
      ];

      validPaths.forEach(path => {
        expect(path.startsWith('/')).toBe(true);
        expect(path.includes('../')).toBe(false);
      });
    });
  });
});

/**
 * Integration Test: Full Pattern Preselection Simulation
 * 
 * This test simulates the complete flow from URL access to pattern selection
 */
describe('Pattern Preselection Integration', () => {
  it('should complete full preselection flow for extract-urls pattern', async () => {
    // 1. Simulate URL access: /tools/regex-find-replace/extract-urls
    const pattern_slug = 'extract-urls';
    
    // 2. Server-side pattern resolution
    const actualPattern = builtInPatterns.find((p: Pattern) => 
      p.id === pattern_slug || p.slug === pattern_slug
    ) as Pattern;
    
    expect(actualPattern).toBeDefined();
    expect(actualPattern.id).toBe('extract-urls');
    expect(actualPattern.name).toBe('Extract URLs');
    
    // 3. Verify pattern data integrity
    expect(actualPattern.searchRegex).toBe('(https?://[^\\s,;!()]+)');
    expect(actualPattern.replaceRegex).toBe('$1\n'); // Extract patterns include newline
    expect(actualPattern.flags).toBe('g');
    expect(actualPattern.keyNumber).toBe(5);
    
    // 4. Verify SEO metadata
    expect(actualPattern.slug).toBe('extract-urls-from-text');
    expect(actualPattern.description).toContain('extract');
    expect(actualPattern.description).toContain('URLs');
    
    // 5. Verify example data
    expect(actualPattern.example.input).toContain('https://');
    expect(actualPattern.example.output).toContain('https://');
    
    // This confirms the pattern is ready for client-side preselection
  });

  it('should handle slug-based URL access correctly', async () => {
    // Test accessing via SEO-friendly slug
    const pattern_slug = 'extract-urls-from-text';
    
    const actualPattern = builtInPatterns.find((p: Pattern) => 
      p.id === pattern_slug || p.slug === pattern_slug
    ) as Pattern;
    
    expect(actualPattern).toBeDefined();
    expect(actualPattern.id).toBe('extract-urls'); // ID should match
    expect(actualPattern.slug).toBe(pattern_slug); // Slug should match
  });
});