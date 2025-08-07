# CodeTweak - Codebase Structure

## Directory Organization

```
dev-utils/
├── src/
│   ├── components/              # UI components
│   │   ├── regex/               # Regex tool components
│   │   └── Welcome.astro        # Welcome component
│   ├── layouts/                 # Page layouts
│   │   ├── BaseLayout.astro     # Main site layout
│   │   └── Layout.astro         # Base layout
│   ├── pages/                   # Astro pages (routes)
│   │   ├── index.astro          # Homepage
│   │   ├── 404.astro            # 404 page
│   │   └── tools/               # Tool-specific pages
│   │       ├── index.astro      # Tools directory page
│   │       └── regex/           # Regex tool pages
│   ├── services/                # Business logic services
│   │   ├── PatternService.ts    # Pattern CRUD operations
│   │   ├── PatternStorageManager.ts # localStorage persistence
│   │   └── RegexService.ts      # Regex transformations
│   ├── stores/                  # Nanostores state management
│   │   └── patternStore.ts      # Pattern state coordination
│   ├── types/                   # TypeScript definitions
│   │   └── pattern.ts           # Pattern-related types
│   ├── utils/                   # Utility functions
│   ├── data/                    # Static data
│   │   └── built-in-patterns.json # Pre-defined patterns
│   ├── styles/                  # CSS styles
│   └── assets/                  # Static assets
├── public/                      # Public assets
├── llm-docs/                    # Project documentation
└── Configuration files          # package.json, tsconfig.json, etc.
```

## Key Architecture Points
- **Service-oriented**: Business logic in service classes
- **Component-based**: React components for UI, Astro for pages
- **Type-safe**: Comprehensive TypeScript interfaces
- **State management**: Nanostores for cross-component communication