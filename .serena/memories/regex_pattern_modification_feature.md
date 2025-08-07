# Regex Pattern Modification Feature

## User Requirements
User wants ability to temporarily modify existing patterns without creating new permanent patterns. When a pattern is selected, user should be able to:
1. Open modification dialog (⌘M shortcut)
2. Edit search/replace regex while keeping pattern context
3. Use modified regex for transformations
4. See clear indication when pattern is modified
5. Reset back to original pattern

## Current System Architecture
- **RegexLayout**: Main container, manages selectedPattern state
- **PatternInfo**: Displays read-only pattern details (name, description, regex, example)
- **transformText()**: Uses pattern ID → RegexService for transformation
- **transformWithCustomRegex()**: Already exists for custom regex (unused in UI)
- **Pattern selection**: Via CommandPalette (⌘K) or key numbers

## Enhanced User Flow
1. Select pattern → PatternInfo shows details + "Modify" button
2. Press ⌘M → ModificationDialog opens with current regex pre-filled
3. Edit regex → Apply changes → PatternInfo shows "Modified Pattern" state
4. Transformations use custom regex instead of original pattern
5. Reset option to return to original pattern

## Technical Implementation Plan
- **State**: Add customRegexStore, isPatternModifiedStore to patternStore.ts
- **Components**: Enhance PatternInfo, create ModificationDialog
- **Transform Logic**: Update transformText() to prioritize custom regex
- **Keyboard**: Add ⌘M shortcut in RegexLayout
- **UI Indicators**: Show modification status in PatternInfo

## Key Design Decisions
- Non-destructive: Original patterns remain unchanged
- Contextual: Modified pattern retains original name/description for reference
- Temporary: Custom regex resets when switching patterns
- Accessible: Full keyboard navigation support