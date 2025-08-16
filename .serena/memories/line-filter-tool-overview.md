# Line Filter Tool

## Summary
A complete filtering utility for large text files and CSV data, built with React/Astro and deployed at `/tools/line-filter/`.

## Key Features
- **File upload** (5MB/10k lines) or **text paste** input
- **Auto-format detection** (CSV vs text)
- **Advanced filtering**: include/exclude patterns, regex support, CSV column filtering
- **Filter management**: create, edit, toggle, delete filters
- **Auto-apply filters** for immediate feedback
- **Click-to-expand**: click lines/cells to view full content in textarea
- **Smart pagination** (100 items/page)
- **Copy results** as text or CSV

## Technical Architecture
- **Services**: DatabaseService (IndexedDB), FileParserService, FilterWorkerService (Web Worker)
- **State**: Nanostores with reactive atoms and computed values
- **Components**: 10 React components in `src/components/line-filter/`
- **Testing**: 36 unit tests covering all major functionality
- **Performance**: Non-blocking filtering, efficient pagination, memoization

## Recent Enhancements
- **Filter editing**: Click edit icon to modify existing filters with pre-populated forms
- **Simplified expansion**: Click any line/cell to open textarea, click outside to close
- **Professional UI**: Card-based layout with consistent visual hierarchy
- **Default data display**: Shows all data when no filters applied

## Usage Patterns
- Log analysis, data processing, code review, content analysis
- Keyboard shortcuts: ⌘K (search), ⌘E (edit), ⌘Enter (apply), Escape (clear)
- Responsive design for desktop and mobile use