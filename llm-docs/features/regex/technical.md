# Regex Helper Tool - Technical Documentation

## Architecture

The Regex Helper Tool will be the first utility in a larger developer tools platform built with Astro, focusing on programmatic SEO while providing a seamless client-side experience.

### Site Structure

```
codetweak/
├── src/
│   ├── pages/
│   │   ├── index.astro             # Main landing page for all tools
│   │   ├── tools/
│   │   │   ├── index.astro         # Tools directory page
│   │   │   ├── regex/
│   │   │   │   ├── index.astro     # Regex tool landing page
│   │   │   │   ├── [patternId].astro # Dynamic pages for each pattern
│   │   │   │   └── new.astro       # Page for creating new patterns
│   │   │   └── [future-tools]/     # Structure for future tools
│   ├── components/
│   │   ├── common/                 # Shared components across tools
│   │   └── regex/                  # Regex-specific components
│   └── utils/                      # Shared utilities
├── public/
│   └── data/
│       └── regex-patterns.json     # Pattern definitions
└── README.md                       # Main project README for GitHub SEO
```

### GitHub Repository Structure

To optimize for GitHub SEO, each tool will have its own README.md file:

```
codetweak/
├── tools/
│   ├── regex/
│   │   ├── README.md              # Regex tool README (rendered by GitHub)
│   │   └── patterns/
│   │       └── README.md          # Patterns documentation
│   └── [future-tools]/
│       └── README.md              # Future tool README
└── README.md                      # Main project README
```

### Component Structure

```
components/regex/
├── RegexHelperApp.jsx       # Main application component
├── CommandPalette.jsx       # Command+K pattern selector
├── InputArea.jsx            # Text input component
├── OutputArea.jsx           # Result display component
├── PatternSelector.jsx      # Pattern selection interface
├── PatternEditor.jsx        # Pattern creation/editing modal
├── ActionButtons.jsx        # Transform, Copy, Clear buttons
├── KeyboardShortcutHint.jsx # Visual indicators for shortcuts
├── PostTransformActions.jsx # Contextual actions after transform
├── PatternStorage/
│   ├── PatternImporter.jsx  # JSON import functionality
│   ├── PatternExporter.jsx  # JSON export functionality
│   └── StorageManager.jsx   # localStorage management utilities
└── README.md                # Component documentation
```

## Data Model

### Pattern Storage

Patterns will be stored in two locations:

1. **Server-side JSON file**: Contains the built-in patterns provided by the application
2. **Client-side localStorage**: Contains user-created patterns

Both use the same data structure, enhanced for SEO:

```json
{
  "patterns": [
    {
      "id": "python-path-to-file",
      "slug": "python-path-to-file-converter",
      "name": "Python Path to File Path",
      "description": "Converts Python import paths to file system paths",
      "searchRegex": "(\\w+)\\.(\\w+)",
      "replaceRegex": "$1/$2",
      "exampleInput": "app.services.sub",
      "exampleOutput": "app/services/sub",
      "seoTitle": "Python Import Path to File Path Converter | Dev Utils",
      "seoDescription": "Convert Python import notation to file system paths with this free online tool. Transform app.services.module to app/services/module instantly.",
      "seoKeywords": ["python path converter", "import path to file path", "dot notation to slash"],
      "createdAt": "2025-03-26T13:30:00Z",
      "updatedAt": "2025-03-26T13:30:00Z"
    }
  ]
}
```

## Technical Implementation

### Pattern Storage Implementation

```javascript
// Storage utility for managing patterns in localStorage
const PatternStorageManager = {
  // Get all patterns (combining server patterns and localStorage patterns)
  getAllPatterns: async () => {
    // Fetch server patterns
    const serverPatterns = await fetch('/data/regex-patterns.json')
      .then(res => res.json())
      .then(data => data.patterns);
    
    // Get localStorage patterns
    const localPatterns = PatternStorageManager.getLocalPatterns();
    
    // Combine and return all patterns
    return [...serverPatterns, ...localPatterns];
  },
  
  // Get only patterns from localStorage
  getLocalPatterns: () => {
    try {
      const stored = localStorage.getItem('user-regex-patterns');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error('Error retrieving patterns from localStorage:', e);
      return [];
    }
  },
  
  // Save a new pattern to localStorage
  savePattern: (pattern) => {
    try {
      const patterns = PatternStorageManager.getLocalPatterns();
      
      // Generate a unique ID if not provided
      if (!pattern.id) {
        pattern.id = `local-${Date.now()}`;
      }
      
      // Add metadata
      pattern.isUserCreated = true;
      pattern.createdAt = new Date().toISOString();
      pattern.updatedAt = new Date().toISOString();
      
      // Add to patterns array
      patterns.push(pattern);
      
      // Save back to localStorage
      localStorage.setItem('user-regex-patterns', JSON.stringify(patterns));
      return pattern;
    } catch (e) {
      console.error('Error saving pattern to localStorage:', e);
      throw e;
    }
  },
  
  // Update an existing pattern in localStorage
  updatePattern: (patternId, updates) => {
    try {
      const patterns = PatternStorageManager.getLocalPatterns();
      const index = patterns.findIndex(p => p.id === patternId);
      
      if (index === -1) {
        throw new Error(`Pattern with ID ${patternId} not found in localStorage`);
      }
      
      // Update the pattern
      patterns[index] = {
        ...patterns[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      // Save back to localStorage
      localStorage.setItem('user-regex-patterns', JSON.stringify(patterns));
      return patterns[index];
    } catch (e) {
      console.error('Error updating pattern in localStorage:', e);
      throw e;
    }
  },
  
  // Delete a pattern from localStorage
  deletePattern: (patternId) => {
    try {
      const patterns = PatternStorageManager.getLocalPatterns();
      const filteredPatterns = patterns.filter(p => p.id !== patternId);
      
      // Save back to localStorage
      localStorage.setItem('user-regex-patterns', JSON.stringify(filteredPatterns));
      return true;
    } catch (e) {
      console.error('Error deleting pattern from localStorage:', e);
      throw e;
    }
  },
  
  // Get all user patterns as formatted JSON string for export
  getExportablePatterns: () => {
    const patterns = PatternStorageManager.getLocalPatterns();
    return JSON.stringify({ patterns }, null, 2); // Pretty-printed JSON
  },
  
  // Import patterns from JSON string
  importPatternsFromString: (jsonString) => {
    try {
      const imported = JSON.parse(jsonString);
      
      if (!imported.patterns || !Array.isArray(imported.patterns)) {
        throw new Error('Invalid pattern format: Missing "patterns" array');
      }
      
      // Get existing patterns
      const existingPatterns = PatternStorageManager.getLocalPatterns();
      const existingIds = new Set(existingPatterns.map(p => p.id));
      
      // Filter out duplicates and add new patterns
      const newPatterns = imported.patterns.filter(p => !existingIds.has(p.id));
      const allPatterns = [...existingPatterns, ...newPatterns];
      
      // Save to localStorage
      localStorage.setItem('user-regex-patterns', JSON.stringify(allPatterns));
      
      return {
        added: newPatterns.length,
        total: allPatterns.length,
        newPatterns
      };
    } catch (e) {
      console.error('Error importing patterns:', e);
      throw e;
    }
  }
};
```

## Technical Implementation

### Hybrid Rendering Approach

To achieve both SEO benefits and client-side interactivity:

1. **Static Generation**: 
   - Generate static pages for each tool and pattern at build time
   - Include SEO metadata, descriptions, and examples
   - Pre-render HTML for initial fast loading and SEO

2. **Client Hydration**:
   - Hydrate the static pages with client-side interactivity
   - Use partial hydration to minimize JavaScript payload
   - Enable client-side pattern switching without page reloads

### URL Strategy

- `/tools/regex-find-replace` - Main regex tool page
- `/tools/regex-find-replace/[pattern-slug]` - Dedicated page for each pattern
- Client-side routing for switching patterns within the tool
- Update URL using history API when patterns change (without page reload)

### Command Palette Implementation

```javascript
// Command palette for pattern selection (Cmd+K)  
function CommandPalette({ patterns, onSelect, isOpen, onClose }) {
  const [search, setSearch] = useState('');
  const filteredPatterns = patterns.filter(pattern => 
    pattern.name.toLowerCase().includes(search.toLowerCase()) ||
    pattern.description.toLowerCase().includes(search.toLowerCase())
  );
  
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Open command palette on Cmd+K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (!isOpen) onOpen();
      }
      // Close on Escape
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onOpen, onClose]);
  
  return (
    <div className={`command-palette ${isOpen ? 'open' : ''}`}>
      <input 
        type="text" 
        placeholder="Search patterns..." 
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        autoFocus
      />
      <div className="pattern-list">
        {filteredPatterns.map(pattern => (
          <div 
            key={pattern.id} 
            className="pattern-item"
            onClick={() => {
              onSelect(pattern);
              onClose();
            }}
          >
            <div className="pattern-name">{pattern.name}</div>
            <div className="pattern-description">{pattern.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Post-Transform Interaction

```javascript
// Component for post-transformation actions
function PostTransformActions({ output, onCopy }) {
  const [visible, setVisible] = useState(true);
  
  useEffect(() => {
    // Show actions when new output is generated
    setVisible(true);
    
    // Hide after delay or user interaction elsewhere
    const timer = setTimeout(() => setVisible(false), 5000);
    return () => clearTimeout(timer);
  }, [output]);
  
  if (!visible || !output) return null;
  
  return (
    <div className="post-transform-actions">
      <button onClick={onCopy} className="copy-button">
        <span className="icon">📋</span>
        <span className="label">Copy</span>
        <span className="shortcut">Cmd+Shift+C</span>
      </button>
    </div>
  );
}
```

## Keyboard Shortcut Implementation

```javascript
// Hook for managing keyboard shortcuts
function useKeyboardShortcuts(shortcuts) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Check if any inputs are focused
      const isInputFocused = ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName);
      
      // Process global shortcuts that work regardless of focus
      shortcuts.forEach(({ key, metaKey, ctrlKey, shiftKey, action, requiresFocus }) => {
        if (e.key === key && 
            (!metaKey || e.metaKey) && 
            (!ctrlKey || e.ctrlKey) && 
            (!shiftKey || e.shiftKey) &&
            (!requiresFocus || !isInputFocused)) {
          e.preventDefault();
          action();
        }
      });
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}
```

## SEO Implementation

### Pattern Page Generation

```javascript
// Astro page template for individual pattern pages
export async function getStaticPaths() {
  const patterns = await import('../../../public/data/regex-patterns.json');
  
  return patterns.patterns.map(pattern => ({
    params: { patternId: pattern.slug },
    props: { pattern }
  }));
}

const { pattern } = Astro.props;
```

```html
<!-- Pattern page template with SEO metadata -->
<html>
<head>
  <title>{pattern.seoTitle}</title>
  <meta name="description" content={pattern.seoDescription} />
  <meta name="keywords" content={pattern.seoKeywords.join(', ')} />
  
  <!-- Open Graph tags -->
  <meta property="og:title" content={pattern.seoTitle} />
  <meta property="og:description" content={pattern.seoDescription} />
  <meta property="og:type" content="website" />
  <meta property="og:url" content={`https://codetweak.example.com/tools/regex-find-replace/${pattern.slug}`} />
  
  <!-- Structured data for rich results -->
  <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "{pattern.name} | Dev Utils",
      "description": "{pattern.seoDescription}",
      "applicationCategory": "DeveloperApplication",
      "operatingSystem": "Any",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      }
    }
  </script>
</head>
<body>
  <!-- Hydrate the client-side app with this pattern pre-selected -->
  <RegexHelperApp client:load initialPatternId={pattern.id} />
</body>
</html>
```

## Performance Considerations

1. **Regex Validation**: Implement validation to prevent invalid regex patterns
2. **Large Text Handling**: Consider chunking for processing very large text inputs
3. **Debouncing**: Apply debouncing for live preview updates during pattern testing
4. **Partial Hydration**: Only hydrate interactive components to reduce JavaScript payload
5. **Code Splitting**: Split code by tool to minimize initial load time

## Accessibility Implementation

1. **Keyboard Navigation**: Full keyboard support with focus management
2. **ARIA Attributes**: Proper labeling for screen readers
3. **Color Contrast**: Ensure sufficient contrast for text elements
4. **Shortcut Visibility**: Visual indicators for available keyboard shortcuts
5. **Focus Trapping**: Trap focus within modals and command palette when open

## Testing Strategy

1. **Unit Tests**: Test regex transformation functions and core regex service
2. **Component Tests**: Test UI components in isolation
3. **Integration Tests**: Test the complete user flows
4. **Accessibility Tests**: Verify keyboard navigation and screen reader compatibility
5. **SEO Tests**: Verify that pages are properly indexed and contain correct metadata

### Core Regex Service Testing

The regex service will have comprehensive tests to ensure core functionality works correctly:

```javascript
// Example test suite for core regex service
describe('RegexService', () => {
  describe('pythonPathConversion', () => {
    test('should convert dot notation to slash notation', () => {
      const input = 'app.services.sub';
      const expected = 'app/services/sub';
      expect(RegexService.transform('python-path-to-file', input)).toBe(expected);
    });
    
    test('should convert slash notation to dot notation', () => {
      const input = 'app/services/sub';
      const expected = 'app.services.sub';
      expect(RegexService.transform('file-path-to-python', input)).toBe(expected);
    });
    
    test('should handle edge cases like empty segments', () => {
      const input = 'app..sub';
      const expected = 'app//sub';
      expect(RegexService.transform('python-path-to-file', input)).toBe(expected);
    });
  });
  
  describe('listFormatting', () => {
    test('should join multiline items with commas', () => {
      const input = 'item1\nitem2\nitem3';
      const expected = 'item1,item2,item3';
      expect(RegexService.transform('join-lines-with-commas', input)).toBe(expected);
    });
    
    test('should add quotes to each item', () => {
      const input = 'item1\nitem2\nitem3';
      const expected = '"item1"\n"item2"\n"item3"';
      expect(RegexService.transform('add-quotes-to-lines', input)).toBe(expected);
    });
    
    test('should add quotes and join with commas', () => {
      const input = 'item1\nitem2\nitem3';
      const expected = '"item1","item2","item3"';
      expect(RegexService.transform('quote-and-join-lines', input)).toBe(expected);
    });
  });
  
  describe('customPatterns', () => {
    test('should correctly apply user-defined patterns', () => {
      // Setup custom pattern
      const customPattern = {
        id: 'custom-test',
        searchRegex: '(\\d+)-(\\d+)',
        replaceRegex: '$2_$1'
      };
      
      // Register pattern temporarily for test
      RegexService.registerPattern(customPattern);
      
      const input = '123-456';
      const expected = '456_123';
      expect(RegexService.transform('custom-test', input)).toBe(expected);
    });
  });
  
  describe('errorHandling', () => {
    test('should handle invalid regex patterns gracefully', () => {
      // Setup invalid pattern
      const invalidPattern = {
        id: 'invalid-test',
        searchRegex: '(\\', // Invalid regex
        replaceRegex: '$1'
      };
      
      // Register pattern temporarily for test
      RegexService.registerPattern(invalidPattern);
      
      expect(() => {
        RegexService.transform('invalid-test', 'test input');
      }).toThrow();
    });
    
    test('should handle very large inputs without crashing', () => {
      // Generate large input
      const largeInput = 'test\n'.repeat(10000);
      
      // Should not throw or time out
      expect(() => {
        RegexService.transform('join-lines-with-commas', largeInput);
      }).not.toThrow();
    });
  });
});
```

## Deployment

The tool will be integrated into the existing Astro build process:

1. Add new components and pages to the Astro project
2. Include the JSON data file in the build
3. Configure dynamic routes for pattern pages
4. Set up proper redirects for clean URLs
5. Deploy with the regular site deployment process

## GitHub SEO Optimization

To optimize the project for GitHub SEO:

1. **README.md Files**: Create detailed README.md files for each tool and major directory
   - Main README.md: Project overview, installation, usage instructions
   - Tool-specific READMEs: Detailed documentation for each tool
   - Include screenshots, examples, and badges

2. **Documentation Structure**:
   - Use proper Markdown formatting with headings, lists, and code blocks
   - Include a table of contents for easy navigation
   - Add links between related documentation files

3. **GitHub Features Utilization**:
   - Use GitHub Pages to host a documentation site
   - Configure repository topics for better discoverability
   - Create a project wiki for extended documentation
   - Add issue and pull request templates

4. **Content Strategy**:
   - Include keywords in headings and descriptions
   - Create detailed examples of each regex pattern
   - Document keyboard shortcuts and usage tips
   - Add contributor guidelines and code of conduct

### Example Tool README.md Structure

```markdown
# Regex Helper Tool

> A powerful, keyboard-focused regular expression utility for developers.

![Demo Screenshot](screenshots/regex-helper-demo.png)

## Features

- Transform text using predefined regex patterns
- Create and save custom patterns
- Import/export patterns as JSON
- Keyboard-focused workflow with shortcuts
- SEO-optimized pattern pages

## Usage

### Quick Start

1. Visit [Regex Helper Tool](https://codetweak.example.com/tools/regex-find-replace)
2. Enter your text in the input area
3. Press Cmd+K to open the pattern selector
4. Choose a pattern and press Enter to transform

### Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Open Command Palette | Cmd+K |
| Transform | Cmd+Enter |
| Copy Result | Cmd+Shift+C |

## Pattern Library

This tool includes several built-in patterns for common developer tasks:

- Convert Python import paths to file system paths
- Join multi-line text into comma-separated values
- Add quotes to each line
- [View all patterns](patterns/README.md)

## Contributing

Contributions are welcome! Please see our [Contributing Guide](../../CONTRIBUTING.md) for details.

## License

MIT
```