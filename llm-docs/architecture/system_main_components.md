# Dev Utils - System Architecture Overview

## Technical Stack

### Core Technologies
- **Astro**: Server-side rendering framework with islands architecture
- **React**: UI component library for interactive elements
- **TypeScript**: Type-safe JavaScript for better developer experience
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Nanostores**: Lightweight state management for cross-component communication

## System Architecture

The Dev Utils platform follows a modular architecture with a focus on:
- Programmatic SEO with dedicated pages for each tool and pattern
- Client-side interactivity with no page refreshes when using tools
- Keyboard-focused workflow for developer efficiency
- Minimalist UI with clear visual indicators

### Component Structure

```
dev-utils/
├── src/                         # Source code
│   ├── components/              # UI components
│   │   ├── common/              # Shared components
│   │   └── regex/               # Regex tool components
│   ├── layouts/                 # Page layouts
│   ├── pages/                   # Astro pages (routes)
│   │   ├── tools/               # Tool-specific pages
│   │   │   └── regex/           # Regex tool pages
│   ├── services/                # Business logic services
│   ├── stores/                  # State management
│   ├── types/                   # TypeScript type definitions
│   └── utils/                   # Utility functions
├── public/                      # Static assets
└── llm-docs/                    # Documentation
```

## Core Components

### 1. State Management

The application uses Nanostores for state management, with the following key stores:

#### Pattern Store (`patternStore.ts`)
- Manages the collection of regex patterns (built-in and user-created)
- Handles pattern selection and transformation
- Maintains UI state (command palette visibility, layout preferences)

```typescript
// Key stores
export const patternsStore = atom<Pattern[]>([]);
export const selectedPatternIdStore = atom<string | null>(null);
export const transformationStore = map<{
  input: string;
  result: TransformationResult | null;
  isProcessing: boolean;
  error: string | null;
}>();
export const uiStateStore = map<{
  isCommandPaletteOpen: boolean;
  isMobileMenuOpen: boolean;
  layout: 'vertical' | 'horizontal';
}>();
```

### 2. Services

#### RegexService (`RegexService.ts`)
- Core service for handling regex transformations
- Validates regex patterns
- Applies transformations to input text
- Handles special cases for complex transformations

#### PatternService (`PatternService.ts`)
- Manages pattern data
- Handles CRUD operations for patterns
- Interfaces with local storage for persistence

### 3. UI Components

#### RegexLayout (`RegexLayout.tsx`)
- Main component for the Regex Helper Tool
- Orchestrates the interaction between input, output, and pattern selection
- Manages layout switching between horizontal and vertical modes

#### Input and Output
- **InputArea**: Text input with auto-resize and keyboard shortcuts
- **OutputArea**: Result display with execution time and error handling

#### Pattern Selection
- **CommandPalette**: Keyboard-driven pattern search (⌘+K)
- **PatternSelector**: Visual browsing of patterns by category
- **PatternInfo**: Displays details about the selected pattern

#### Pattern Management
- **PatternForm**: Create and edit patterns
- **PatternImportExport**: Import/export patterns as JSON
- **PatternManager**: List, edit, and delete user patterns

### 4. Routing and Pages

#### Dynamic Pattern Pages
- Each pattern has a dedicated URL for SEO optimization
- Pattern-specific metadata for search engines

```
/tools/regex/[patternId].astro
```

#### Tool Pages
- Main tool page with all components
- Pattern creation and management pages
- 404 page for better user experience

## Data Flow

1. **Pattern Loading**:
   - On initial load, `PatternService` fetches built-in patterns and user patterns
   - Patterns are stored in `patternsStore` and registered with `RegexService`

2. **Pattern Selection**:
   - User selects a pattern via CommandPalette or PatternSelector
   - Selected pattern ID is stored in `selectedPatternIdStore`
   - RegexLayout updates to display pattern info

3. **Text Transformation**:
   - User enters text in InputArea
   - On transform action (⌘+Enter), `transformText` function is called
   - `RegexService` applies the selected pattern to transform the text
   - Result is stored in `transformationStore` and displayed in OutputArea

4. **Pattern Management**:
   - User creates/edits patterns via PatternForm
   - PatternService saves to localStorage
   - Patterns are immediately available for use

## Main Files and Their Functions

### Services

| File | Path | Function |
|------|------|----------|
| `RegexService.ts` | `/src/services/RegexService.ts` | Core service for regex transformations and validation |
| `PatternService.ts` | `/src/services/PatternService.ts` | Manages pattern data and storage operations |
| `PatternStorageManager.ts` | `/src/services/PatternStorageManager.ts` | Handles localStorage operations for patterns |

### Stores

| File | Path | Function |
|------|------|----------|
| `patternStore.ts` | `/src/stores/patternStore.ts` | Central state management for patterns and UI state |

### Components

| File | Path | Function |
|------|------|----------|
| `RegexLayout.tsx` | `/src/components/regex/RegexLayout.tsx` | Main layout for the Regex Helper Tool |
| `InputArea.tsx` | `/src/components/regex/InputArea.tsx` | Text input component with auto-resize |
| `OutputArea.tsx` | `/src/components/regex/OutputArea.tsx` | Result display component |
| `CommandPalette.tsx` | `/src/components/regex/CommandPalette.tsx` | Keyboard-driven pattern search (⌘+K) |
| `PatternSelector.tsx` | `/src/components/regex/PatternSelector.tsx` | Visual pattern browsing by category |
| `PatternInfo.tsx` | `/src/components/regex/PatternInfo.tsx` | Displays pattern details |
| `PatternForm.tsx` | `/src/components/regex/PatternForm.tsx` | Form for creating/editing patterns |
| `PatternImportExport.tsx` | `/src/components/regex/PatternImportExport.tsx` | Import/export patterns as JSON |
| `ActionButtons.tsx` | `/src/components/regex/ActionButtons.tsx` | Action buttons for transformations |

### Pages

| File | Path | Function |
|------|------|----------|
| `index.astro` | `/src/pages/tools/regex/index.astro` | Main Regex Helper Tool page |
| `[patternId].astro` | `/src/pages/tools/regex/[patternId].astro` | Dynamic page for each pattern (SEO) |
| `create.astro` | `/src/pages/tools/regex/create.astro` | Pattern creation page |
| `manage.astro` | `/src/pages/tools/regex/manage.astro` | Pattern management page |

### Types

| File | Path | Function |
|------|------|----------|
| `pattern.ts` | `/src/types/pattern.ts` | TypeScript interfaces for pattern data |

## Development Guide

### Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Code Style

- **TypeScript**: Use strict mode with proper type annotations
- **React Components**: Functional components with hooks
- **CSS**: Tailwind utility classes for styling
- **State Management**: Nanostores for cross-component state

### Adding New Patterns

1. For built-in patterns, add to `src/data/built-in-patterns.json`
2. Ensure pattern has:
   - Unique ID
   - Clear name and description
   - Valid regex with proper escaping
   - Example input/output
   - Appropriate category and tags

### Adding New Tools

1. Create a new directory under `src/components/[tool-name]/`
2. Add pages under `src/pages/tools/[tool-name]/`
3. Create tool-specific services and types as needed
4. Update navigation to include the new tool

### Testing

- Test regex patterns with various inputs
- Verify pattern import/export functionality
- Check responsive layout on different screen sizes
- Test keyboard shortcuts for accessibility

### Performance Considerations

- Lazy-load components where possible
- Optimize regex patterns for performance
- Use memoization for expensive computations
- Ensure smooth transitions and animations