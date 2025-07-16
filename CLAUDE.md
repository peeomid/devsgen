# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**CodeTweak** is a collection of developer utilities designed to streamline common tasks and boost productivity.

## Development Commands

All commands are run from the root directory:

- `npm run dev` - Start development server at localhost:4321
- `npm run build` - Build for production to ./dist/
- `npm run preview` - Preview production build locally
- `npm run test` - Run tests with Vitest
- `npm run test:watch` - Run tests in watch mode
- `npm run lint` - Run ESLint on src/ directory

## Architecture Overview

This is an **Astro application** that provides a regex pattern management and transformation tool as part of the CodeTweak developer utilities collection. The application uses:

- **Astro** with React components for the UI
- **Nanostores** for state management
- **Tailwind CSS** for styling
- **TypeScript** for type safety
- **Vitest** for testing

### Core Services Architecture

The application follows a service-oriented architecture with clear separation of concerns:

1. **PatternService** (`src/services/PatternService.ts`) - Core business logic for pattern CRUD operations, search, and validation
2. **PatternStorageManager** (`src/services/PatternStorageManager.ts`) - Handles localStorage persistence
3. **RegexService** (`src/services/RegexService.ts`) - Handles regex transformation operations
4. **Pattern Store** (`src/stores/patternStore.ts`) - Nanostores-based state management that orchestrates services

### Key Data Structures

- **Pattern** interface (`src/types/pattern.ts`) - Core pattern type with unique ID, keyNumber (for quick access), shortKeys (max 3 chars), search/replace regex, categories, and metadata
- **Built-in vs User Patterns** - Built-in patterns (read-only) are loaded from JSON, user patterns are stored in localStorage
- **Pattern Categories** - Enum-based categorization system (Format Conversion, Text Extraction, etc.)

### State Management Flow

The application uses a centralized store pattern where:
- Services handle business logic and data persistence
- Stores coordinate between services and UI components
- React components consume stores via nanostores/react hooks

### Key Features

- **Pattern Management** - Create, edit, delete, and search regex patterns
- **Quick Access** - Numeric key access and short key lookup for patterns
- **Pattern Validation** - Comprehensive validation for regex syntax and pattern constraints
- **Import/Export** - JSON-based pattern sharing
- **Responsive Layout** - Adaptive vertical/horizontal layouts with hybrid approach
- **Command Palette** - Keyboard-driven pattern selection (Cmd+K)
- **Keyboard-Focused Workflow** - Minimal mouse usage required

### Project Context & SEO Strategy

- Part of a larger developer utilities collection
- Programmatic SEO approach: each tool and pattern has dedicated pages
- Client-side experience within tools (no page refreshes when switching patterns)
- Open-source with GitHub SEO optimization via README files in each tool directory

### File Structure Notes

- `src/components/regex/` - React components for regex tool UI
- `src/pages/tools/regex/` - Astro pages for different regex tool views
- `src/data/built-in-patterns.json` - Pre-defined patterns
- `llm-docs/` - Contains project documentation and architecture notes

### Component Architecture

The regex tool follows a hierarchical component structure:

```
BaseLayout (Astro)
└── RegexLayout                    # Main container component
    ├── PatternInfo                # Display pattern details
    ├── InputArea                  # Text input with auto-resize
    │   └── ActionButtons          # Transform and action buttons
    ├── OutputArea                 # Result display
    └── CommandPalette             # Pattern search overlay (⌘+K)
```

### UI Design Patterns

- **Hybrid Layout**: Responsive design that adapts between split-view (large screens) and stacked (small screens)
- **Keyboard-First**: Command palette (Cmd+K), shortcuts for all actions
- **Post-Transform Actions**: Temporary floating copy button appears after transformations
- **Pattern Import/Export**: Textarea-based JSON import/export for pattern sharing

### Common Use Cases

The tool is designed for common developer tasks:
- Convert Python import paths: `app.services.sub` → `app/services/sub`
- Join multi-line items: `item1\nitem2\nitem3` → `item1,item2,item3`
- Add quotes to lines: `item1\nitem2` → `"item1"\n"item2"`

### Important Documentation

- **System Architecture**: `llm-docs/architecture/system_main_components.md` - Detailed component hierarchy and data flow
- **Implementation Plan**: `llm-docs/features/regex/implementation_plan.md` - Comprehensive feature breakdown and todos
- **Requirements**: `llm-docs/features/regex/requirements.md` - Original use cases and preferences
- **Technical Details**: `llm-docs/features/regex/technical.md` - Storage, SEO, and implementation specifics
- **UI Design**: `llm-docs/features/regex/ui.md` - Layout patterns and interaction flows

### Testing

Uses Vitest for unit testing. Run tests with `npm run test` or `npm run test:watch` for development.