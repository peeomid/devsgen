# CodeTweak - Essential Development Commands

## Development Server
```bash
npm run dev          # Start development server at localhost:4321
npm run start        # Alias for npm run dev
```

## Build & Preview
```bash
npm run build        # Build for production to ./dist/
npm run preview      # Preview production build locally
```

## Code Quality
```bash
npm run lint         # Run ESLint on src/ directory
npm run test         # Run tests with Vitest
npm run test:watch   # Run tests in watch mode
```

## Package Management
```bash
npm install          # Install dependencies
```

## Additional Commands
```bash
npm run astro        # Direct access to Astro CLI
```

## Development Workflow
1. Run `npm run dev` to start development server
2. Make changes to code
3. Run `npm run lint` to check code quality
4. Run `npm run test` to verify functionality
5. Run `npm run build` to test production build