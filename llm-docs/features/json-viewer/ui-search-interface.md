# JSON Viewer - Unified Search Interface Design

## Overview

The JSON Viewer tool uses a unified search interface that combines value search, property name search, and path scoping into a single, intuitive interface. This design eliminates the confusion of separate search modes and provides powerful filtering capabilities.

## Interface Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Search in: [Both ▼] [Properties ▼] [Values ▼]              │
│ 🔍 Search...                                       [Search] │
│ 📂 Scope to path: batters.batter[].type (optional)   [✕]   │
└─────────────────────────────────────────────────────────────┘
```

## Search Components

### 1. Search Type Selector (Dropdown)
- **Both** (default): Search both property names AND values
- **Properties**: Search only property names (keys)
- **Values**: Search only values (data)

### 2. Search Input Field
- Main text input for search query
- Case-insensitive by default
- Requires clicking [Search] button or pressing Enter to execute
- User can clear manually (no auto-clear button)

### 3. Path Scope (Optional)
- **Empty by default**: Searches entire JSON structure
- **Click-to-fill**: Click any property in the tree view to auto-fill path
- **Manual entry**: Users can type paths like `batters.batter[0].type`
- **Clear button [✕]**: Removes path scope restriction
- **Display**: Shows readable path format (e.g., `batters.batter[].type`)

## Search Behavior

### Filtering Results
When search is executed, the tree view:
- ✅ **Shows matching items** (highlighted)
- ✅ **Shows parent path** (for context)
- ❌ **Hides non-matching items**
- Maintains tree structure for navigation

### Search Examples

#### Example 1: Search Both + No Path Scope
```
Type: "Both"
Query: "type"
Scope: (empty)

Results:
├─ "type": "donut"                    ← property name match
├─ batters → batter → [0] → "type": "Regular"    ← property name
├─ batters → batter → [1] → "type": "Chocolate"  ← property name
└─ topping → [0] → "type": "None"     ← property name
```

#### Example 2: Search Values + Path Scope
```
Type: "Values"
Query: "chocolate"
Scope: "topping[].type"

Results:
└─ topping → [4] → "type": "Chocolate with Sprinkles"
(Ignores "Chocolate" in batters.batter[1].type due to scope)
```

#### Example 3: Search Properties + Path Scope
```
Type: "Properties"
Query: "id"
Scope: "batters.batter[]"

Results:
├─ batters → batter → [0] → "id": "1001"
├─ batters → batter → [1] → "id": "1002"
├─ batters → batter → [2] → "id": "1003"
└─ batters → batter → [3] → "id": "1004"
(Ignores root "id": "0001" and topping IDs)
```

## User Flow

1. **Select search type** from dropdown (defaults to "Both")
2. **Enter search query** in text input
3. **Optionally scope search** by clicking a property in the tree
4. **Execute search** by clicking [Search] button or pressing Enter
5. **View filtered results** in the tree view
6. **Clear search** by clearing the input and searching again

## Design Principles

### Simplicity
- Single search interface eliminates confusion
- Progressive disclosure (path scope is optional)
- Clear visual hierarchy

### Discoverability
- Click-to-fill path makes advanced features discoverable
- Dropdown options are self-explanatory
- No hidden functionality behind modals

### Performance
- Search executes on demand (not real-time)
- Tree filtering provides focused results
- Maintains context with parent paths

## Technical Considerations

### Path Format
- Uses dot notation for objects: `batters.batter`
- Uses bracket notation for arrays: `batter[0]` or `batter[]` for any index
- Combines both: `batters.batter[].type`

### Search Algorithm
- Case-insensitive string matching
- Supports partial matches
- Respects path scope boundaries
- Maintains original tree structure for context

### State Management
- Search state persists during session
- Path scope can be cleared independently
- Results update immediately on search execution