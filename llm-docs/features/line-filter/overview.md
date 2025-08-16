# Line Filter Tool Overview

## Purpose
The Line Filter Tool is a powerful utility for filtering and searching through large text files and CSV data efficiently. It's designed for developers who need to quickly find specific lines or patterns in log files, data exports, and other text-based content.

## Key Features

### Data Input
- **File Upload**: Drag & drop or browse to upload text/CSV files (up to 5MB or 10,000 lines)
- **Text Paste**: Direct text input with auto-format detection
- **Format Detection**: Automatically detects CSV format with delimiter and header detection

### Filtering Capabilities
- **Text Filters**: Include/exclude patterns with regex support
- **CSV Filters**: Column-specific or all-column filtering
- **Auto-Apply**: Filters automatically apply when added for immediate feedback
- **Filter Management**: Edit, toggle, and remove existing filters
- **Case Sensitivity**: Optional case-sensitive matching
- **Regex Support**: Full regex pattern matching capabilities

### Results Display
- **Smart Pagination**: Efficient handling of large result sets (100 items per page)
- **Click-to-Expand**: Click any line/cell to view full content in textarea
- **Copy Results**: Export filtered results as text or CSV
- **Line Numbers**: Preserved line numbering from original file
- **Real-time Updates**: Results update immediately as filters change

### User Experience
- **Professional UI**: Card-based layout with consistent visual hierarchy
- **Responsive Design**: Works on desktop and mobile devices
- **Keyboard Shortcuts**: 
  - `⌘+K` - Quick filter search
  - `⌘+E` - Edit mode
  - `⌘+Enter` - Apply filters
  - `Escape` - Clear data
- **Default Display**: Shows all data when no filters applied
- **Performance**: Web Worker-based filtering for non-blocking operations

## Technical Architecture

### Core Components
- **LineFilterLayout**: Main container and layout management
- **FileUploader**: File input handling with drag & drop
- **TextPaster**: Direct text input with process button
- **TextFilterInput/CSVFilterInput**: Filter creation and editing forms
- **FilterList**: Active filter management with edit capabilities
- **TextResults/CSVResults**: Results display with pagination and expansion

### Services
- **DatabaseService**: IndexedDB storage for line data
- **FileParserService**: File type detection and parsing
- **FilterWorkerService**: Web Worker for non-blocking filtering operations

### State Management
- **Nanostores**: Reactive state management with atoms and computed values
- **Real-time Updates**: Automatic UI updates when data or filters change
- **Persistent Storage**: Client-side storage for large datasets

## Testing
- **36 Unit Tests**: Comprehensive test coverage for all major components
- **Component Testing**: React Testing Library for UI components
- **Service Testing**: Jest tests for business logic
- **E2E Testing**: Playwright tests for user workflows

## Performance Considerations
- **Web Workers**: Non-blocking filtering operations
- **Pagination**: Efficient memory usage for large result sets
- **IndexedDB**: Client-side storage for better performance
- **Memoization**: Prevents unnecessary re-renders
- **Lazy Loading**: Only load visible results

## Use Cases
- **Log Analysis**: Filter error logs or specific event types
- **Data Processing**: Extract specific records from CSV exports
- **Code Review**: Find specific patterns in code dumps
- **Content Analysis**: Search through large text documents
- **Data Validation**: Verify data integrity in CSV files