# CodeTweak - Code Style & Conventions

## Code Style Guidelines
- **TypeScript strict mode**: Uses `astro/tsconfigs/strict` configuration
- **Interface definitions**: Comprehensive type definitions with JSDoc comments
- **Service-oriented architecture**: Clear separation between services, stores, and components
- **Explicit type imports**: Uses `import type` for type-only imports

## Naming Conventions
- **PascalCase**: Classes, interfaces, enums (e.g., `PatternService`, `PatternCategory`)
- **camelCase**: Variables, functions, methods (e.g., `getAllPatterns`, `isInitialized`)
- **UPPER_SNAKE_CASE**: Enum values (e.g., `FORMAT_CONVERSION`, `TEXT_EXTRACTION`)
- **kebab-case**: File names and directories (e.g., `pattern-service.ts`, `regex-layout.tsx`)

## Architecture Patterns
- **Service classes**: Business logic encapsulated in service classes
- **Nanostores**: State management with reactive stores
- **Component hierarchy**: Clear parent-child relationships
- **Type safety**: Comprehensive interfaces for all data structures

## Documentation
- JSDoc comments for all public methods and interfaces
- Inline comments for complex logic
- README files for project overview
- Separate documentation in `llm-docs/` directory