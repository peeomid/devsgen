# CodeTweak - Development Guidelines

## Design Principles

### 1. Programmatic SEO
- Each tool and pattern has dedicated pages
- Client-side experience within tools (no page refreshes when switching patterns)
- SEO-optimized URLs for discoverability

### 2. Keyboard-First Workflow
- Minimal mouse usage required
- Command palette (Cmd+K) for quick access
- Keyboard shortcuts for all common actions
- Numeric key access for patterns

### 3. Privacy & Performance
- All processing happens client-side (browser)
- Data never leaves the user's device
- Responsive design for all screen sizes
- Hybrid layout that adapts between split-view and stacked

### 4. Developer Experience
- Built by developers, for developers
- Type-safe development with TypeScript
- Component-based architecture
- Comprehensive documentation

## Key Features to Maintain
- **Pattern Management**: CRUD operations for regex patterns
- **Quick Access**: Multiple ways to find and use patterns
- **Import/Export**: JSON-based pattern sharing
- **Validation**: Comprehensive regex and pattern validation
- **Categories**: Organized pattern categorization system

## Adding New Tools
1. Create components in `src/components/[tool-name]/`
2. Add pages in `src/pages/tools/[tool-name]/`
3. Create services and types as needed
4. Update navigation in BaseLayout.astro
5. Add documentation in `llm-docs/`