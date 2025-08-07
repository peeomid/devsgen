# CodeTweak - Task Completion Checklist

## When completing any coding task, run these commands:

### 1. Code Quality Check
```bash
npm run lint
```
- Fix any linting errors before proceeding
- Ensure code follows TypeScript and ESLint rules

### 2. Testing
```bash
npm run test
```
- Verify all tests pass
- Add new tests for new functionality if needed

### 3. Build Verification
```bash
npm run build
```
- Ensure production build succeeds
- Check for any build-time errors or warnings

### 4. Preview (Optional)
```bash
npm run preview
```
- Test the production build locally
- Verify functionality works correctly in production mode

## Notes
- Always run linting and tests before committing
- The project uses Vitest for testing (though test files may not exist yet)
- ESLint configuration includes TypeScript, React, and Astro plugins
- Build process includes asset optimization and SSR compilation