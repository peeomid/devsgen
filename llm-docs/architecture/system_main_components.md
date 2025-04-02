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

#### Component Hierarchy

The Regex Helper Tool follows a hierarchical component structure. Below is a tree representation of how components are organized:

```
BaseLayout (Astro)                  # Main site layout with header, footer, etc.
└── RegexLayout                      # Main container for the Regex Helper Tool
    ├── PatternInfo                  # Displays selected pattern details
    ├── InputArea                    # Text input component
    │   └── ActionButtons            # Transform and create pattern buttons
    ├── OutputArea                   # Result display component
    └── CommandPalette               # Pattern search overlay (⌘+K)
        └── PatternList              # List of patterns in command palette

PatternImportExport                 # Standalone component for pattern import/export

PatternForm                         # Standalone component for pattern creation/editing
└── PatternValidator                # Validates regex patterns

PatternManager                      # Standalone component for managing patterns
└── PatternList                     # List of user patterns
    └── PatternItem                 # Individual pattern with edit/delete options
```

#### Main Components

##### RegexLayout (`RegexLayout.tsx`)
- Main container component for the Regex Helper Tool
- Orchestrates the interaction between input, output, and pattern selection
- Manages layout switching between horizontal and vertical modes
- Handles keyboard shortcuts and state management

##### Input and Output
- **InputArea**: Text input with auto-resize and keyboard shortcuts
  - Handles text entry and transformation triggers
  - Supports keyboard shortcuts (⌘+Enter to transform)
- **OutputArea**: Result display with execution time and error handling
  - Shows transformation results
  - Displays execution time and any errors
  - Provides copy-to-clipboard functionality

##### Pattern Selection
- **CommandPalette**: Keyboard-driven pattern search (⌘+K)
  - Overlay component for quick pattern search
  - Keyboard navigation support
  - Fuzzy search functionality
- **PatternSelector**: Visual browsing of patterns by category
  - Categorized display of available patterns
  - Filtering by category
- **PatternInfo**: Displays details about the selected pattern
  - Shows pattern name, description, and example
  - Displays regex details and flags

##### Pattern Management
- **PatternForm**: Create and edit patterns
  - Form for pattern creation and editing
  - Validation of regex patterns
- **PatternImportExport**: Import/export patterns as JSON
  - Export user patterns as JSON
  - Import patterns from JSON file
- **PatternManager**: List, edit, and delete user patterns
  - CRUD operations for user patterns
  - Confirmation dialogs for deletion

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

## Component Interactions and Data Flow

### Page Structure

The main Regex Helper Tool page (`/tools/regex/index.astro`) is structured as follows:

```
<BaseLayout>
  <header>
    <!-- Title, description, keyboard shortcuts info -->
  </header>
  
  <RegexLayout client:load />
  
  <section>
    <PatternImportExport client:load />
  </section>
  
  <section>
    <!-- About section with features and instructions -->
  </section>
</BaseLayout>
```

### Data Flow

1. **Pattern Loading**:
   - On initial page load, the script calls `initializePatternStore()`
   - `PatternService` fetches built-in patterns from JSON and user patterns from localStorage
   - Patterns are stored in `patternsStore` and registered with `RegexService`
   - If patterns exist, the first pattern is automatically selected

2. **Pattern Selection**:
   - User selects a pattern via CommandPalette (⌘+K) or PatternSelector
   - Selected pattern ID is stored in `selectedPatternIdStore`
   - RegexLayout observes this store and updates to display pattern info
   - InputArea is focused and text is selected for immediate editing

3. **Text Transformation**:
   - User enters text in InputArea
   - On transform action (⌘+Enter or button click), `transformText` function is called
   - `transformationStore` sets `isProcessing` to true
   - `RegexService` applies the selected pattern to transform the text
   - Result is stored in `transformationStore` with output, execution time, and any errors
   - OutputArea observes this store and updates to display the results

4. **Pattern Management**:
   - User creates/edits patterns via PatternForm on dedicated pages
   - PatternService validates and saves to localStorage via PatternStorageManager
   - User can import/export patterns via PatternImportExport component
   - Patterns are immediately available for use after creation/import

### Component Communication

Components communicate primarily through Nanostores:

- **patternsStore**: Shared by all components that need access to patterns
- **selectedPatternIdStore**: Used to track the currently selected pattern
- **transformationStore**: Manages the transformation input, output, and state
- **uiStateStore**: Controls UI elements like command palette visibility and layout

This store-based approach allows components to remain decoupled while sharing state.

## Main Files and Their Functions

### Services

| File | Path | Function | Parent/Dependencies |
|------|------|----------|---------------------|
| `RegexService.ts` | `/src/services/RegexService.ts` | Core service for regex transformations and validation | Used by patternStore |
| `PatternService.ts` | `/src/services/PatternService.ts` | Manages pattern data and storage operations | Uses PatternStorageManager |
| `PatternStorageManager.ts` | `/src/services/PatternStorageManager.ts` | Handles localStorage operations for patterns | Used by PatternService |

### Stores

| File | Path | Function | Dependencies |
|------|------|----------|-------------|
| `patternStore.ts` | `/src/stores/patternStore.ts` | Central state management for patterns and UI state | Uses RegexService, PatternService |

### Components

| File | Path | Function | Parent Component |
|------|------|----------|------------------|
| `RegexLayout.tsx` | `/src/components/regex/RegexLayout.tsx` | Main layout for the Regex Helper Tool | BaseLayout (Astro) |
| `InputArea.tsx` | `/src/components/regex/InputArea.tsx` | Text input component with auto-resize | RegexLayout |
| `OutputArea.tsx` | `/src/components/regex/OutputArea.tsx` | Result display component | RegexLayout |
| `CommandPalette.tsx` | `/src/components/regex/CommandPalette.tsx` | Keyboard-driven pattern search (⌘+K) | RegexLayout |
| `PatternSelector.tsx` | `/src/components/regex/PatternSelector.tsx` | Visual pattern browsing by category | Standalone/Various |
| `PatternInfo.tsx` | `/src/components/regex/PatternInfo.tsx` | Displays pattern details | RegexLayout |
| `PatternForm.tsx` | `/src/components/regex/PatternForm.tsx` | Form for creating/editing patterns | Standalone (create.astro) |
| `PatternImportExport.tsx` | `/src/components/regex/PatternImportExport.tsx` | Import/export patterns as JSON | BaseLayout (index.astro) |
| `ActionButtons.tsx` | `/src/components/regex/ActionButtons.tsx` | Action buttons for transformations | InputArea |
| `PatternList.tsx` | `/src/components/regex/PatternList.tsx` | List of patterns | CommandPalette, PatternManager |
| `PatternItem.tsx` | `/src/components/regex/PatternItem.tsx` | Individual pattern with actions | PatternList |
| `PatternValidator.tsx` | `/src/components/regex/PatternValidator.tsx` | Validates regex patterns | PatternForm |

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