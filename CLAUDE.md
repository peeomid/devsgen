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
- **Pattern Modification** - Temporarily modify existing patterns without creating permanent changes (⌘E inline editing)
- **Quick Access** - Numeric key access and short key lookup for patterns
- **Pattern Validation** - Comprehensive validation for regex syntax and pattern constraints
- **Import/Export** - JSON-based pattern sharing
- **Responsive Layout** - Adaptive vertical/horizontal layouts with hybrid approach
- **Command Palette** - Keyboard-driven pattern selection (Cmd+K)
- **Keyboard-Focused Workflow** - Minimal mouse usage required

### Pattern Modification Workflow

The application supports temporary pattern modification with the following user flow:

1. **Pattern Selection**: Use ⌘K to open command palette and select a pattern
2. **Pattern Display**: Three-panel structure shows:
   - **PatternSelectorBar**: Current pattern name with Find/Edit buttons
   - **RegexEditor**: Live regex inputs (search/replace/flags) 
   - **PatternReference**: Pattern description, examples, and details
3. **Inline Editing**: Press ⌘E or click Edit button to focus regex input
4. **Live Modification**: Edit regex directly with real-time validation
5. **Visual State**: UI shows "Custom Regex (based on Pattern Name)" when modified
6. **Reference Hiding**: Pattern reference panel hides during modification to avoid confusion
7. **Auto-Reset**: Switching patterns automatically resets modifications

**Key Design Principles**:
- Non-destructive: Original patterns never changed
- State-based UI: Interface adapts based on modification state  
- Keyboard-first: ⌘E works anytime to start editing
- Clear visual feedback: Modified state clearly indicated

### Project Context & SEO Strategy

- Part of a larger developer utilities collection
- Programmatic SEO approach: each tool and pattern has dedicated pages
- Client-side experience within tools (no page refreshes when switching patterns)
- Open-source with GitHub SEO optimization via README files in each tool directory

### File Structure Notes

- `src/components/regex/` - React components for regex tool UI
- `src/pages/tools/regex-find-replace/` - Astro pages for different regex tool views
- `src/data/built-in-patterns.json` - Pre-defined patterns
- `llm-docs/` - Contains project documentation and architecture notes

### Component Architecture

The regex tool follows a hierarchical component structure with a hybrid layout:

```
BaseLayout (Astro)
└── RegexLayout                    # Main container component
    ├── Desktop: Split Layout      # Large screens (lg+)
    │   ├── Left Column            # Input/Output areas
    │   │   ├── InputArea          # Text input with auto-resize
    │   │   └── OutputArea         # Result display  
    │   └── Right Column (400px)   # Three-panel regex structure
    │       ├── PatternSelectorBar # Current pattern + Find/Edit buttons
    │       ├── RegexEditor        # Main working area with regex inputs
    │       └── PatternReference   # Conditional pattern info display
    ├── Mobile: Stacked Layout     # Small screens
    │   ├── PatternSelectorBar     # Pattern selection and actions
    │   ├── RegexEditor            # Regex input fields
    │   ├── PatternReference       # Collapsible pattern info (mobile)
    │   ├── InputArea              # Text input
    │   └── OutputArea             # Result display
    └── CommandPalette             # Pattern search overlay (⌘+K)
```

### UI Design Patterns

- **Hybrid Layout**: Responsive design that adapts between split-view (large screens) and stacked (small screens)
- **Keyboard-First**: Command palette (Cmd+K), pattern editing (Cmd+E), shortcuts for all actions
- **Inline Pattern Editing**: Three-panel structure with inline regex editing and conditional reference info
- **State-Based UI**: Pattern reference panel hidden during modification to avoid confusion
- **Post-Transform Actions**: Temporary floating copy button appears after transformations
- **Pattern Import/Export**: Textarea-based JSON import/export for pattern sharing

### Common Use Cases

The tool is designed for common developer tasks:
- Convert Python import paths: `app.services.sub` → `app/services/sub`
- Join multi-line items: `item1\nitem2\nitem3` → `item1,item2,item3`
- Add quotes to lines: `item1\nitem2` → `"item1"\n"item2"`
- Quick pattern tweaks: Modify existing patterns temporarily for one-off transformations

### Important Documentation

- **System Architecture**: `llm-docs/architecture/system_main_components.md` - Detailed component hierarchy and data flow
- **Implementation Plan**: `llm-docs/features/regex/implementation_plan.md` - Comprehensive feature breakdown and todos
- **Requirements**: `llm-docs/features/regex/requirements.md` - Original use cases and preferences
- **Technical Details**: `llm-docs/features/regex/technical.md` - Storage, SEO, and implementation specifics
- **UI Design**: `llm-docs/features/regex/ui.md` - Layout patterns and interaction flows

### Pattern Preselection from URL Technical Flow

**Critical Implementation Detail:** When users access pattern-specific URLs like `/tools/regex-find-replace/extract-urls`, the pattern must be automatically preselected in the tool. This flow involves multiple components working together:

#### 1. Static Route Generation (`src/pages/tools/regex-find-replace/[pattern_slug].astro`)
- Astro generates static routes for each built-in pattern during build
- Routes are created for both pattern IDs and SEO-friendly slugs
- Pattern data is passed as props to the page component

#### 2. Server-Side Pattern Resolution
```javascript
// Find pattern from built-in patterns JSON
const actualPattern = pattern || builtInPatterns.find((p: Pattern) => 
  p.id === pattern_slug || p.slug === pattern_slug) as Pattern;
```

#### 3. Client-Side Pattern Store Initialization
**CRITICAL:** The dynamic import path in the preselection script must use absolute paths:

```javascript
<script define:vars={{ patternId: actualPattern.id }}>
document.addEventListener('DOMContentLoaded', async () => {
  // ✅ CORRECT: Use absolute path for dynamic imports
  const { initializePatternStore, selectPattern } = await import('/src/stores/patternStore.ts');
  
  // ❌ WRONG: Relative paths cause 404 errors in browser
  // const { ... } = await import('../../../stores/patternStore');
  
  await initializePatternStore();
  selectPattern(patternId);
});
</script>
```

#### 4. Pattern Store Coordination
- `initializePatternStore()` loads all patterns from services
- `selectPattern(patternId)` sets the active pattern in the store
- React components automatically update via nanostores reactivity

#### 5. Common Pitfalls to Avoid
- **Relative Import Paths**: Browser dynamic imports require absolute paths from domain root
- **Initialization Order**: Always call `initializePatternStore()` before `selectPattern()`
- **State Corruption**: Restart dev server if patterns stop loading during development
- **Pattern ID vs Slug**: Handle both pattern.id and pattern.slug for URL matching

#### 6. Debugging Pattern Preselection Issues
1. Check browser console for 404 import errors
2. Verify pattern exists in `built-in-patterns.json` 
3. Confirm pattern ID matches the URL parameter exactly
4. Test with both pattern ID and slug URLs
5. Restart development server to clear any state corruption

### Testing

Uses Vitest for unit testing. Run tests with `npm run test` or `npm run test:watch` for development.

**Current Test Coverage:**
- **Store Tests** - Custom regex state management, pattern selection integration
- **Component Tests** - PatternSelectorBar, RegexEditor, PatternReference functionality and accessibility  
- **Pattern Tests** - URL extraction, email extraction, and other regex pattern functionality
- **36 tests total** - All passing with comprehensive coverage of the three-panel architecture

### Keyboard Shortcuts

| Action | Shortcut | Description |
|--------|----------|-------------|
| Open Command Palette | ⌘K | Search and select patterns |
| Edit Pattern/Focus Regex | ⌘E | Focus search regex input for editing |
| Transform Text | ⌘Enter | Apply current regex to input text |
| Copy Output | ⌘⇧C | Copy transformation result |
| Focus Input Area | ⌘1 | Move cursor to input textarea |
| Focus Output Area | ⌘2 | Move cursor to output textarea |