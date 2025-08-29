# Beautifier Unification Plan

## Overview

This document outlines the plan to unify two separate beautifier systems in the codebase:
1. **UI System (Complex)**: Uses web worker → `beautify()` → tokenization pipeline 
2. **Test System (Simple)**: Uses `BracketFormatterService.format()` directly

**Goal**: Keep web worker performance while using the proven BracketFormatterService logic for consistent formatting between UI and tests.

## Problem Analysis

### Current Architecture Issues
- **UI Path**: Component → Worker → `beautify()` → tokenize → preprocess → `format()` → postprocess
- **Test Path**: Tests → `BracketFormatterService.format()`
- **Result**: Tests pass but UI produces ugly PHP var_dump formatting because they use completely different implementations

### Root Cause
The UI uses a complex tokenization system that breaks PHP var_dump structure, while tests use a simple, proven formatter that handles PHP var_dump correctly.

## Solution Strategy

**Replace the complex formatting pipeline with BracketFormatterService while preserving the web worker architecture.**

```
BEFORE: UI → Worker → beautify() → [complex pipeline] → ugly output
AFTER:  UI → Worker → beautify() → BracketFormatterService.format() → good output
```

## Detailed Implementation Plan

### 1. Core Formatter Replacement

**File: `src/lib/beautify/beautify.ts`**

**Current Code Structure:**
```typescript
export function beautify(text: string, options: BeautifyOptions): BeautifyResult {
  // Tokenize the input
  const rawTokens = tokenize(text, { keepComments: options.keepComments });
  
  // Apply mode-specific preprocessing
  let processedTokens = rawTokens;
  switch (options.mode) {
    case 'structure': processedTokens = preprocessTokensStructure(rawTokens, options); break;
    case 'jsonish': processedTokens = preprocessTokensJsonish(rawTokens, options); break;
    case 'phpish': processedTokens = preprocessTokensPhpish(rawTokens, options); break;
  }

  // Format the tokens
  const result = format(processedTokens, options);

  // Apply mode-specific postprocessing
  let finalOutput = result.output;
  switch (options.mode) {
    case 'structure': finalOutput = postprocessOutputStructure(finalOutput, options); break;
    case 'jsonish': finalOutput = postprocessOutputJsonish(finalOutput, options); break;
    case 'phpish': finalOutput = postprocessOutputPhpish(finalOutput, options); break;
  }

  return { ...result, output: finalOutput };
}
```

**New Implementation:**
```typescript
import type { BeautifyOptions, BeautifyResult } from '../../types/beautify.ts';
import { BracketFormatterService } from '../../services/BracketFormatterService.ts';
import { detectType, suggestModeFromDetection } from './detect.ts';

export { detectType, suggestModeFromDetection };

export function beautify(text: string, options: BeautifyOptions): BeautifyResult {
  const startTime = performance.now();
  
  try {
    const indentStr = options.useTabs ? '\t' : ' '.repeat(options.indent);
    
    // Use BracketFormatterService for all formatting
    const output = BracketFormatterService.format(text, indentStr);
    
    return {
      output,
      diagnostics: { warnings: [] },
      timeMs: performance.now() - startTime
    };
  } catch (error) {
    return {
      output: text, // Return original on error
      diagnostics: { 
        warnings: [`Formatting error: ${error instanceof Error ? error.message : String(error)}`] 
      },
      timeMs: performance.now() - startTime
    };
  }
}
```

**Changes:**
- Remove all complex imports (tokenize, format, preprocessing, postprocessing)
- Add BracketFormatterService import
- Replace entire function body with simple service call
- Keep detection functions for UI compatibility
- Simplify error handling with fallback to original text

### 2. Worker Integration

**File: `src/workers/beautifyWorker.ts`**

**Status: NO CHANGES NEEDED**

The worker already calls the `beautify()` function, so it will automatically use the new BracketFormatterService implementation. Web worker benefits preserved:
- Asynchronous processing for large inputs
- Progress reporting 
- UI responsiveness during formatting

### 3. Options Mapping Strategy

**Used Options:**
- `indent`: Mapped to space count in `indentStr` parameter
- `useTabs`: Mapped to tab vs spaces in `indentStr` parameter

**Ignored Options** (BracketFormatterService doesn't need these):
- `mode`: BracketFormatterService handles all structures uniformly
- `keepComments`: BracketFormatterService preserves what it can automatically
- `conservative`: BracketFormatterService is naturally conservative
- `newlineAfterComma`: BracketFormatterService always adds newlines after commas

### 4. Error Handling & Fallback Strategy

**Single Fallback**: If BracketFormatterService throws any error, return original text with warning message.

**No Complex Fallback**: Don't attempt to fall back to old tokenization system - keep the implementation simple and reliable.

### 5. Test Updates

**File: `src/__tests__/beautify/beautify.test.ts`**

Some tests may need expectation updates to match BracketFormatterService behavior instead of complex tokenization output. Tests should now pass because UI uses same logic as BracketFormatterService tests.

## Implementation Steps

### Step 1: Modify Core Beautify Function
1. Open `src/lib/beautify/beautify.ts`
2. Replace entire function implementation with BracketFormatterService call
3. Update imports as specified above
4. Remove complex options handling

### Step 2: Test the Changes
1. Run beautify tests: `npm test -- src/__tests__/beautify/`
2. Update any failing test expectations to match BracketFormatterService behavior
3. Verify all beautify tests pass

### Step 3: Test UI Integration
1. Start development server: `npm run dev`
2. Navigate to beautify tool
3. Test with PHP var_dump samples from the original issue
4. Verify web worker functionality still works
5. Confirm formatting matches test expectations

### Step 4: Final Verification
1. Run full test suite: `npm test`
2. Verify UI and tests produce identical formatting
3. Test performance with large inputs to ensure worker benefits preserved

## Expected Outcomes

✅ **Unified Logic**: UI and tests use same BracketFormatterService implementation
✅ **Web Worker Preserved**: Performance benefits maintained for large inputs
✅ **PHP var_dump Fixed**: Uses proven formatting logic from BracketFormatterService
✅ **Simplified Architecture**: Remove complex tokenization system
✅ **Test Consistency**: All formatting goes through tested service layer
✅ **Backward Compatible**: UI functionality preserved with better output quality

## Files Affected

### Modified Files:
- `src/lib/beautify/beautify.ts` - Core implementation replacement
- `src/__tests__/beautify/beautify.test.ts` - Test expectation updates

### Unchanged Files:
- `src/workers/beautifyWorker.ts` - Automatic integration via beautify() call
- All UI components - No changes needed
- `src/services/BracketFormatterService.ts` - Already proven and tested

### Files That Become Unused (but kept for safety):
- `src/lib/beautify/format.ts` - Complex formatter logic
- `src/lib/beautify/tokenize.ts` - Tokenization system
- `src/lib/beautify/modes/*.ts` - Mode-specific preprocessing
- These files remain in codebase but won't be called by new implementation

## Risk Assessment

- **Low Risk**: BracketFormatterService is proven with passing tests
- **High Confidence**: Simplifying complex system reduces potential failure points  
- **Reversible**: Easy to revert changes if unexpected issues arise
- **Performance**: Web worker architecture fully preserved

## Success Criteria

1. All beautify tests pass
2. UI produces same output as tests for identical input
3. PHP var_dump formatting is clean and readable
4. Web worker functionality maintained for large inputs
5. No regression in existing formatting capabilities