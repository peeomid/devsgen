# JSON Viewer - Technical Implementation

## Architecture Overview

The JSON Viewer follows a service-oriented architecture with clear separation between data management, UI components, and search functionality. It leverages Nanostores for state management and Web Workers for performance.

## Core Technologies

### Frontend Stack
- **Astro**: Static site generation with React components
- **React**: Interactive UI components
- **TypeScript**: Type safety and developer experience
- **Nanostores**: Lightweight state management
- **Tailwind CSS**: Utility-first styling

### Storage & Performance
- **Web Workers**: JSON processing and search operations
- **OPFS (Origin Private File System)**: Large file storage
- **localStorage**: Settings and session persistence
- **IndexedDB**: Fallback for large data storage

## State Management

### Core Store Structure
```typescript
// Core data atoms
export const originalJSON = atom<string | null>(null);
export const parsedJSON = atom<any | null>(null);
export const fileId = atom<string | null>(null);
export const fileName = atom<string | null>(null);

// Search atoms
export const searchQuery = atom<string>('');
export const searchType = atom<'both' | 'properties' | 'values'>('both');
export const searchPath = atom<string>('');
export const searchResults = atom<SearchResult | null>(null);

// Display atoms
export const expandedPaths = atom<Set<string>>(new Set());
export const filteredView = atom<boolean>(false);
```

### Auto-Expansion Implementation
```typescript
// Auto-expand JSON tree after loading
jsonViewerActions.expandAll();

expandAll(): void {
  const json = parsedJSON.get();
  if (!json) return;

  const allPaths = new Set<string>();
  const traverse = (obj: any, path: string = '') => {
    if (typeof obj === 'object' && obj !== null) {
      if (Array.isArray(obj)) {
        allPaths.add(path);
        obj.forEach((item, index) => {
          traverse(item, path ? `${path}[${index}]` : `[${index}]`);
        });
      } else {
        allPaths.add(path);
        Object.keys(obj).forEach(key => {
          const newPath = path ? `${path}.${key}` : key;
          traverse(obj[key], newPath);
        });
      }
    }
  };

  traverse(json);
  expandedPaths.set(allPaths);
}
```

## JSON Validation & Error Handling

### Enhanced Validation
```typescript
export class JSONValidator {
  static validate(jsonString: string): JSONValidationResult {
    // 1. Try parsing as-is
    // 2. Apply auto-fixes for common issues
    // 3. Provide detailed error information
    // 4. NO auto-fix for multiple JSON objects
  }

  static fixCommonIssues(jsonString: string): JSONFixResult {
    // Trailing commas: ✅ Auto-fix
    // Single quotes: ❌ Disabled (corrupts apostrophes)
    // Multiple objects: ❌ Show error instead
    // Comments: ✅ Auto-fix
    // Unquoted keys: ✅ Auto-fix
  }
}
```

### Error Prevention for Concatenated JSON
- **Problem**: Paste events causing JSON duplication
- **Solution**: `e.preventDefault()` in paste handler
- **Result**: Clear error messages instead of silent auto-fixes

## Search Implementation

### Unified Search Interface
```typescript
interface SearchConfig {
  query: string;
  type: 'both' | 'properties' | 'values';
  pathScope?: string;
}

interface SearchResult {
  matches: SearchMatch[];
  filteredJSON: any;
  totalMatches: number;
}

interface SearchMatch {
  path: string;
  type: 'property' | 'value';
  value: any;
  context: string[];
}
```

### Search Algorithm
```typescript
class JSONSearchService {
  search(config: SearchConfig): SearchResult {
    const { query, type, pathScope } = config;
    
    // 1. Parse path scope if provided
    const scopePaths = pathScope ? this.parsePath(pathScope) : null;
    
    // 2. Traverse JSON tree
    const matches = this.traverseForMatches(this.json, '', query, type, scopePaths);
    
    // 3. Filter JSON to show only matches + parent paths
    const filteredJSON = this.buildFilteredTree(matches);
    
    return { matches, filteredJSON, totalMatches: matches.length };
  }

  private traverseForMatches(
    obj: any,
    currentPath: string,
    query: string,
    type: SearchType,
    scopePaths: string[] | null
  ): SearchMatch[] {
    // Implementation for recursive search with path scoping
  }

  private buildFilteredTree(matches: SearchMatch[]): any {
    // Build new tree structure showing only matches and their parents
  }
}
```

### Path Scope Implementation
```typescript
// Path parsing for scope restrictions
class PathParser {
  static parse(path: string): PathSegment[] {
    // Examples:
    // "batters.batter[].type" → [obj: batters, obj: batter, array: any, prop: type]
    // "topping[0].id" → [obj: topping, array: 0, prop: id]
  }

  static matches(objectPath: string[], scopePath: PathSegment[]): boolean {
    // Check if object path falls within scope path boundaries
  }
}
```

## Performance Optimizations

### Web Worker Integration
```typescript
// Main thread - UI
const workerService = JSONWorkerService.getInstance();
await workerService.setJSON(content, fileId);
const results = await workerService.search(searchConfig);

// Worker thread - Processing
self.onmessage = (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'SEARCH':
      const results = performSearch(data.config);
      self.postMessage({ type: 'SEARCH_COMPLETE', results });
      break;
  }
};
```

### Storage Strategy
```typescript
// Large file handling
class StorageService {
  async saveJSON(id: string, name: string, content: string): Promise<StorageLocation> {
    const size = new Blob([content]).size;
    
    if (size > 10 * 1024 * 1024) { // > 10MB
      return await this.saveToOPFS(id, name, content);
    } else if (size > 1024 * 1024) { // > 1MB
      return await this.saveToIndexedDB(id, name, content);
    } else {
      return this.saveToMemory(id, name, content);
    }
  }
}
```

## Component Architecture

### Search Component Structure
```typescript
// SearchInterface.tsx
export const SearchInterface: React.FC = () => {
  const [searchType, setSearchType] = useState<SearchType>('both');
  const [searchQuery, setSearchQuery] = useState('');
  const [pathScope, setPathScope] = useState('');

  const handleSearch = useCallback(() => {
    jsonViewerActions.search({
      query: searchQuery,
      type: searchType,
      pathScope: pathScope || undefined
    });
  }, [searchQuery, searchType, pathScope]);

  const handlePathClick = useCallback((path: string) => {
    setPathScope(path);
  }, []);

  return (
    <div className="search-interface">
      <SearchTypeSelector value={searchType} onChange={setSearchType} />
      <SearchInput value={searchQuery} onChange={setSearchQuery} onSearch={handleSearch} />
      <PathScope value={pathScope} onChange={setPathScope} onClear={() => setPathScope('')} />
    </div>
  );
};
```

### Tree View Integration
```typescript
// TreeNode.tsx
export const TreeNode: React.FC<TreeNodeProps> = ({ path, data, isExpanded }) => {
  const handlePropertyClick = useCallback(() => {
    // Auto-fill path scope when property is clicked
    jsonViewerActions.setSearchPath(path);
  }, [path]);

  return (
    <div className="tree-node">
      <button onClick={handlePropertyClick} className="property-name">
        {propertyName}
      </button>
      {/* Rest of tree node rendering */}
    </div>
  );
};
```

## Testing Strategy

### Unit Tests
- JSON validation with edge cases
- Search algorithm accuracy
- Path parsing and matching
- Auto-expansion logic

### Integration Tests
- Full search workflow
- File upload and validation
- Error handling flows
- Performance with large files

### E2E Tests (Playwright)
- Complete user workflows
- Search interface interactions
- File upload scenarios
- Error state handling

## Security Considerations

### Input Sanitization
- JSON content validation before parsing
- Path injection prevention in search scope
- File size limits and validation
- Memory usage monitoring

### Data Privacy
- No external API calls
- Client-side only processing
- Automatic cleanup of stored data
- Session-based storage with expiration

## Migration & Compatibility

### Browser Support
- Modern browsers with OPFS support
- Graceful fallback to IndexedDB/localStorage
- Web Worker compatibility checks
- Progressive enhancement approach

### Data Migration
- Backward compatibility for stored sessions
- Version-aware state restoration
- Cleanup of outdated storage formats
- Automatic migration on app updates