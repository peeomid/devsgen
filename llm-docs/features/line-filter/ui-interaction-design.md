# Line Filter Tool - UI/Interaction Design

## Current UI Design (Before OR Enhancement)

### Layout Structure
```
┌─ Header ────────────────────────────────────────────────┐
│ Line Filter Tool                                [Help]  │
│ Filter and search through large text files...           │
└─────────────────────────────────────────────────────────┘

┌─ Filter Section ────────────────────────────────────────┐
│ Filters                    [CSV • 4 lines • 3 columns] │
│ ────────────────────────────────────────────────────────│
│ [pattern...] [Include▼] [All columns▼] [Aa] [.*] [Add] │
│ ────────────────────────────────────────────────────────│
│ 2 Active [Apply] [Clear]                                │
│ [filter1 ☑] (5) [✏] [×]  [filter2 ☑] (12) [✏] [×]     │
└─────────────────────────────────────────────────────────┘

┌─ Results Section ───────────────────────────────────────┐
│ CSV Results (4 rows)                        [Copy CSV]  │
│ ────────────────────────────────────────────────────────│
│ Showing 1-4 of 4 results (3 columns)                   │
│ │Line│Col1    │Col2    │Col3    │                      │
│ │ 1  │exclude │example │sample  │                      │
│ │ 2  │filter  │pattern │match   │                      │
│ └────┴────────┴────────┴────────┘                      │
└─────────────────────────────────────────────────────────┘
```

### Current Filter Input Structure
```
Single-Line Compact Design:
[Filter pattern...] [Include/Exclude] [Scope] [Options] [Add]
│                  │                 │       │        │
│                  │                 │       │        └─ Add filter button
│                  │                 │       └─ Aa (case) .* (regex) toggles  
│                  │                 └─ All columns / specific column
│                  └─ Include/Exclude dropdown
└─ Single pattern input (no OR support)
```

### Current Keyboard Shortcuts
- **Enter**: Add filter (single pattern only)
- **Cmd+Enter**: Add filter (alternative)
- **Escape**: Clear all data
- **Tab**: Navigate between controls

### Current Interaction Flow
1. User types single pattern in input field
2. Selects include/exclude and scope options
3. Presses Enter or clicks Add to create filter
4. Filter appears as compact tag in active filters row
5. Multiple filters use AND logic between them

## Problems with Current Design

### UX/Psychology Issues
1. **No OR Capability**: Users must create multiple filters for OR logic
2. **Hidden Potential**: No visual indication that complex logic is possible
3. **Cognitive Overhead**: Managing multiple similar filters is cumbersome
4. **Limited Discoverability**: Advanced features not self-evident

### Technical Limitations
1. **Single Pattern Per Filter**: One pattern = one filter
2. **No Pattern Grouping**: Related OR patterns appear as separate filters
3. **Complex Filter Management**: Many filters clutter the interface
4. **Limited Logic Expression**: Can't express (A OR B) AND C elegantly

## Enhanced Design: Tag-Based OR Filters

### New UI Structure
```
┌─ Enhanced Filter Input ─────────────────────────────────┐
│ [error ×] [warning ×] [+ Add OR pattern] [Include▼]    │
│ ☐ Case sensitive  ☐ Use regex  [All columns▼]          │
│                                            [Add Filter] │
└─────────────────────────────────────────────────────────┘

┌─ Active Filters ────────────────────────────────────────┐
│ 2 Active [Apply] [Clear]                                │
│ ┌─ Filter 1: Include ─────────────────────────────────┐ │
│ │ [error ×] [warning ×] [failure ×] (15 matches) [✏] │ │
│ └─────────────────────────────────────────────────────┘ │
│ ┌─ Filter 2: Include ─────────────────────────────────┐ │
│ │ [database ×] (8 matches) [✏] [×]                   │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Enhanced Keyboard Shortcuts
- **Enter**: Add OR pattern to current filter
- **Shift+Enter**: Add complete filter (with all OR patterns)
- **Escape**: Clear current input or exit edit mode
- **Tab**: Navigate between pattern tags and controls
- **Backspace** (on empty input): Remove last pattern tag

### Progressive Enhancement UX
1. **Single Pattern Start**: Input begins as single field (familiar)
2. **Capability Discovery**: After first pattern, "+ Add OR pattern" appears
3. **Visual Learning**: Tags immediately show OR relationship
4. **Complex Building**: Can build sophisticated (A OR B OR C) filters
5. **Clear Logic**: Visual grouping shows filter relationships

### Tag-Based Pattern Management

#### Single Pattern (Simple Case)
```
Input: [database                    ] [Add Filter]
Result: Simple single-pattern filter
```

#### Multiple Patterns (OR Logic)
```
Input: [error ×] [warning ×] [critical ×] [+ Add OR pattern] [Add Filter]
Logic: Lines containing (error OR warning OR critical)
```

#### Multiple Filters (AND Logic)
```
Filter 1: [error ×] [warning ×] → matches (error OR warning)
Filter 2: [database ×]          → matches database
Result: Lines containing (error OR warning) AND database
```

### Interaction Patterns

#### Adding OR Patterns
1. Type first pattern, press Enter → becomes tag, input clears
2. Type second pattern, press Enter → becomes second tag
3. Continue adding patterns as needed
4. Press Shift+Enter → creates complete filter with all patterns

#### Editing Patterns
1. Click on tag → inline editing mode
2. Modify pattern text
3. Press Enter → save changes
4. Press Escape → cancel changes

#### Removing Patterns
1. Click × on tag → removes individual pattern
2. Backspace on empty input → removes last pattern
3. If last pattern removed → reverts to simple input

### Visual Design Principles

#### Affordances
- **Tags**: Immediately suggest "multiple values possible"
- **+ Button**: Clear invitation to add more patterns
- **Grouping**: Visual containers show logical relationships
- **Feedback**: Live match counts and validation states

#### Progressive Disclosure
- **Start Simple**: Single input field (not overwhelming)
- **Reveal Capability**: OR functionality appears when relevant
- **Build Complexity**: Advanced users can create complex logic
- **Stay Simple**: Basic users never see unnecessary complexity

#### Familiar Patterns
- **Email Tags**: Similar to Gmail, Outlook contact fields
- **Social Tags**: Like Twitter, Instagram hashtag inputs
- **Code Editors**: Similar to VS Code search with multiple terms
- **Form Builders**: Like survey tools with multiple choice options

## Implementation Strategy

### Phase 1: Core Tag Functionality
1. Convert filter inputs to tag-based pattern management
2. Implement Enter vs Shift+Enter keyboard shortcuts
3. Add visual pattern grouping and OR logic display
4. Maintain backward compatibility with single patterns

### Phase 2: Enhanced UX
1. Add pattern validation and error states per tag
2. Implement drag-and-drop reordering of patterns
3. Add pattern suggestion/autocomplete
4. Keyboard navigation between tags

### Phase 3: Advanced Features
1. Pattern templates and saved combinations
2. Bulk pattern operations (copy/paste multiple)
3. Pattern history and recent patterns
4. Export/import complex filter configurations

## Expected User Benefits

### Discoverability
- OR functionality is immediately visible through UI affordances
- No hidden syntax or documentation required
- Progressive enhancement teaches advanced features naturally

### Usability
- Visual pattern management reduces cognitive load
- Clear logical relationships between patterns and filters
- Familiar interaction patterns from other applications
- Comprehensive keyboard support for power users

### Efficiency
- Build complex logic faster through visual interface
- Reduce number of separate filters needed
- Clear visual feedback about what's being filtered
- Easy modification and refinement of filter logic

This enhanced design transforms the line filter from a simple pattern-matching tool into a powerful, discoverable logical filtering system while maintaining ease of use for simple cases.