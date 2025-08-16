# Line Filter Tool - Technical Details

## File Structure

```
src/components/line-filter/
├── LineFilterLayout.tsx         # Main layout component
├── FileUploader.tsx             # File upload with drag & drop
├── TextPaster.tsx               # Text input component
├── FormatDetector.tsx           # Data format display
├── TextFilterInput.tsx          # Text filter form
├── CSVFilterInput.tsx           # CSV filter form
├── FilterList.tsx               # Active filters management
├── TextResults.tsx              # Text results display
├── CSVResults.tsx               # CSV results display
├── ProgressBar.tsx              # Loading progress
└── HelpModal.tsx                # Help documentation

src/services/
├── DatabaseService.ts           # IndexedDB operations
├── FileParserService.ts         # File parsing logic
└── FilterWorkerService.ts       # Web Worker management

src/stores/
└── lineFilterStore.ts           # Nanostores state management

src/types/
├── lineFilter.ts                # Main type definitions
├── filters.ts                   # Filter type definitions
├── database.ts                  # Database schema types
└── ui.ts                        # UI state types

public/
└── filter.worker.js             # Web Worker for filtering
```

## Key Technical Implementations

### Filter Edit Functionality
- **Edit Mode**: Click edit icon to modify existing filters
- **Pre-population**: Form automatically loads existing filter values
- **Auto-apply**: Updated filters automatically re-apply
- **Cancel Support**: Exit edit mode without changes
- **Type Safety**: Proper TypeScript handling for TextFilter vs CSVFilter

### Click-to-Expand Content
- **Text Results**: Click any line to open textarea (24px height)
- **CSV Results**: Click any cell to open textarea (16px height)
- **Outside Click**: Click outside to close textarea
- **Event Handling**: Proper event propagation to prevent conflicts
- **Visual Feedback**: Hover effects and active state styling

### Data Processing Pipeline
1. **File Upload/Text Input** → FileParserService
2. **Format Detection** → Auto-detect CSV vs text
3. **Data Storage** → IndexedDB via DatabaseService
4. **Worker Initialization** → Load data into Web Worker
5. **Filter Application** → Non-blocking filtering operations
6. **Result Display** → Paginated results with expansion

### Performance Optimizations
- **Web Workers**: Prevent UI blocking during filtering
- **IndexedDB**: Efficient client-side storage for large datasets
- **Pagination**: Memory-efficient result display
- **Memoization**: React.useMemo for expensive calculations
- **Event Debouncing**: Prevent rapid state updates

### State Management Architecture
```typescript
// Core data atoms
dataType: 'none' | 'text' | 'csv'
lineCount: number
csvHeaders: string[]
fileId: string | null

// Filter management
activeFilters: Record<string, TextFilter | CSVFilter>
filterResults: Record<string, FilterResult>
isFiltering: boolean

// UI state
currentPage: number
editingFilterId: string | null
selectedElement: string | null
```

### Filter Processing Logic
```typescript
// Text filtering
interface TextFilter {
  pattern: string;
  type: 'include' | 'exclude';
  caseSensitive: boolean;
  useRegex: boolean;
}

// CSV filtering
interface CSVFilter extends TextFilter {
  scope: 'all' | 'column';
  columnIndex?: number;
  columnName?: string;
}
```

### Error Handling
- **File Size Limits**: 5MB max file size, 10,000 line limit
- **Format Validation**: Proper CSV delimiter detection
- **Regex Validation**: Real-time regex syntax checking
- **Worker Errors**: Graceful fallback for Web Worker failures
- **Storage Errors**: IndexedDB error handling with user feedback

### Testing Strategy
- **Component Tests**: React Testing Library for UI interactions
- **Service Tests**: Jest for business logic validation
- **Integration Tests**: Full workflow testing
- **Performance Tests**: Large dataset handling validation

## Browser Compatibility
- **Modern Browsers**: Chrome 90+, Firefox 88+, Safari 14+
- **Web Workers**: Required for filtering operations
- **IndexedDB**: Required for data storage
- **FileReader API**: Required for file uploads

## Security Considerations
- **Client-side Only**: No data transmitted to servers
- **File Validation**: Type and size validation on upload
- **XSS Prevention**: Proper text escaping in results
- **Memory Management**: Cleanup on component unmount