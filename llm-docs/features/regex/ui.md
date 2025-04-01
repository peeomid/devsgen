# Regex Helper Tool - UI Design

## Overview
The Regex Helper Tool is the first of many developer utilities in a programmatic SEO-focused site. Each tool and regex pattern will have its own dedicated page with SEO-optimized content, while maintaining a seamless client-side experience within each tool.

## Navigation Structure

### Multi-level Navigation
1. **Top Level**: Developer Utilities Hub
   - Navigation between different tools (Regex Helper, future tools)
   - Each tool has its own URL and dedicated landing page

2. **Tool Level**: Regex Helper Tool
   - Main interface for the regex transformation functionality
   - Persistent URL with client-side pattern switching

3. **Pattern Level**: Individual Regex Patterns
   - Each pattern has a dedicated URL for SEO purposes
   - When accessed directly, loads the tool with that pattern pre-selected
   - Switching patterns happens client-side without page refresh

## Layout

### Main Interface
1. **Input/Output Areas**
   - Large textarea for input text (top section)
   - Large textarea for output text (bottom section)
   - Clear visual distinction between input and output areas
   - Resizable text areas to accommodate different content sizes

2. **Action Controls**
   - Transform button (primary action) with visible keyboard shortcut
   - Copy result button with clipboard icon and visible shortcut
   - Clear button to reset input/output fields

3. **Pattern Selection**
   - Command palette (Cmd+K) for quick pattern search and selection
   - Pattern cards showing name, description, and example
   - Quick toggle between frequently used patterns
   - Visual indication of currently selected pattern

4. **Pattern Management**
   - "Add New Pattern" button with keyboard shortcut
   - Edit/Delete options for existing patterns
   - "Export Patterns" button to show user's custom patterns as JSON in a textarea
   - "Import Patterns" button to open a textarea for pasting JSON patterns
   - Visual indication of pattern source (built-in vs. user-created)

### Pattern Creation/Edit Modal
1. **Pattern Details**
   - Name field (required)
   - Description field (optional)
   - Search regex pattern field
   - Replace regex pattern field
   - SEO metadata fields (keywords, description for pattern page)
   - Storage location indicator (read-only, shows "Built-in" or "Local Storage")

2. **Testing Section**
   - Example input field
   - Live preview of transformation result
   - Validation indicators

3. **Action Buttons**
   - Save pattern
   - Cancel
   - Delete (when editing existing pattern)

## Interaction Flow

### Basic Usage Flow
1. User enters or pastes text in the input area
2. User presses Cmd+K to open command palette and selects a pattern (or clicks pattern)
3. User presses Cmd+Enter to transform the text
4. Result appears in the output area with focus automatically moved there
5. User presses Cmd+Shift+C to copy the result (or it's auto-selected for easy copying)

### Pattern Creation Flow
1. User presses Cmd+N to create a new pattern
2. User fills in pattern details
3. User tests pattern with example input
4. User presses Cmd+S to save the new pattern to localStorage

### Pattern Import/Export Flow
1. User clicks "Export Patterns" to view their custom patterns as JSON in a textarea
2. User can select and copy the JSON text
3. User clicks "Import Patterns" to open a textarea for pasting JSON
4. User pastes JSON and clicks "Validate and Import"
5. System validates the JSON format
6. User confirms which patterns to import (in case of duplicates)
7. Patterns are added to localStorage

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Open Command Palette | Cmd+K |
| Transform | Cmd+Enter |
| Copy Result | Cmd+Shift+C |
| Clear Fields | Cmd+Shift+X |
| Create New Pattern | Cmd+N |
| Save Pattern (when editing) | Cmd+S |
| Toggle Focus Between Input/Output | Tab |

## UI Expert Discussion on Post-Transform Interaction

**Designer A**: "After transformation, we should automatically select the output text to make copying easier. This saves the user from having to manually select text."

**Designer B**: "I disagree. Auto-selection might be disruptive if the user wants to make additional edits to the output. Instead, we should move focus to the output area and provide a prominent copy button."

**Designer C**: "What about showing a temporary toast notification with a 'Copy' button after transformation? It's non-intrusive but provides immediate access to copying."

**Designer D**: "I think we should combine approaches. Move focus to the output, show a subtle highlight animation, and display a temporary floating 'Copy' button near the cursor position."

**Designer E**: "Consider the keyboard-centric workflow. After transformation, we should move focus to output and show keyboard shortcut hints for copying (Cmd+Shift+C) prominently."

## Post-Transform Interaction Options

### Option 1: Auto-Selection
- Automatically select all output text after transformation
- User can immediately copy with Cmd+C or click copy button
- **Pros**: Fastest path to copying
- **Cons**: May interfere with users wanting to edit output

### Option 2: Focus Shift with Hint
- Move focus to output area after transformation
- Display a subtle animation highlighting the copy shortcut
- **Pros**: Non-intrusive, maintains user control
- **Cons**: Requires additional action to copy

### Option 3: Temporary Action Panel
- After transformation, show a small floating panel near the output
- Panel contains copy button and common actions
- Automatically disappears after a few seconds or on user interaction
- **Pros**: Provides contextual actions without disrupting workflow
- **Cons**: Additional visual element

## Visual UI Description

### Overall Layout
The interface follows a clean, minimalist design with clear visual hierarchy:

![Regex Helper Tool Layout](https://via.placeholder.com/800x600.png?text=Regex+Helper+Layout)

1. **Header Area**
   - Tool name and icon on the left
   - Pattern selector dropdown/button in the center
   - Command palette indicator (Cmd+K) on the right
   - Simple, unobtrusive design with subtle borders

2. **Main Content Area**
   - Clear visual separation between input and output sections
   - Equal prominence to both areas
   - Generous padding and spacing for readability
   - Light background with subtle grid or pattern

3. **Action Controls**
   - Prominent, colorful transform button in the center
   - Copy and clear buttons with recognizable icons
   - Visual tooltips showing keyboard shortcuts on hover
   - Button states (hover, active, disabled) clearly indicated

### Visual Elements

1. **Input/Output Areas**
   - Clean, monospaced font for code readability
   - Subtle syntax highlighting where appropriate
   - Line numbers for multi-line input
   - Soft shadows or borders to define areas
   - Resizing handles visible on hover

2. **Pattern Selection**
   - Dropdown with search field and pattern cards
   - Visual indicators for frequently used patterns
   - Clear, readable pattern names with icons
   - Subtle animations for transitions

3. **Command Palette**
   - Appears centered with semi-transparent overlay
   - Clean search field with instant filtering
   - Results shown with clear visual hierarchy
   - Keyboard navigation indicators
   - Dismissible by clicking outside or pressing Escape

4. **Post-Transform Feedback**
   - Subtle animation when transform completes
   - Temporary floating copy button near cursor
   - Visual indication that output is ready
   - Non-intrusive success indicators

### Color Scheme
- Primary action color: Blue (#3B82F6)
- Secondary actions: Gray (#6B7280)
- Success indicators: Green (#10B981)
- Error indicators: Red (#EF4444)
- Background: Light gray (#F9FAFB)
- Text: Dark gray (#1F2937)
- Accents: Light blue (#DBEAFE)

### Typography
- UI elements: System font stack (San Francisco on macOS)
- Code/input/output: Monospace font (SF Mono or similar)
- Clear hierarchy with different weights and sizes
- Consistent line height and spacing

## Visual Design Options

### Option 1: Stacked Layout with Toolbar
- Input and output areas stacked vertically
- Horizontal toolbar with pattern selector and actions
- Command palette accessible via button or Cmd+K
- Works well on all screen sizes
- Balances keyboard and mouse usability

### Option 2: Split View with Side Panel
- Input and output areas side by side
- Pattern details and selection in collapsible side panel
- Action buttons between input and output areas
- Better utilization of wide screens
- Equal emphasis on keyboard and mouse interactions

## Hybrid Layout Approach (Selected Design)

### Overview

The Regex Helper Tool will implement a responsive hybrid layout that combines the strengths of both the Split View and Stacked Layout options. This approach automatically adapts to different screen sizes and user preferences, providing an optimal experience across devices while maintaining consistent functionality.

### Adaptive Layout Behavior

#### Large Screens (>1200px)
- **Default**: Split View with Side Panel
- Input and output areas displayed side by side
- Pattern selection panel on the right side
- Action buttons positioned between input and output areas
- Full utilization of available screen width

#### Medium Screens (768px-1200px)
- **Default**: Modified Split View
- Input and output areas side by side but with reduced width
- Pattern panel collapses to a dropdown/modal to save space
- Action buttons remain between input and output
- Optimized spacing for medium-width displays

#### Small Screens (<768px)
- **Automatic switch**: Stacked Layout
- Input area positioned above output area
- Horizontal toolbar with essential controls
- Pattern selection accessed via dropdown or command palette
- Optimized for vertical scrolling on narrow screens

#### User Preference Override
- Layout preference toggle in settings
- Users can force either layout regardless of screen size
- Preference saved between sessions

### Transition Behavior

#### Responsive Transitions
- Smooth animations when switching between layouts
- Content reflow without losing current state
- Maintains scroll position and selection when possible
- Graceful handling of text area resizing

#### Layout Persistence
- Current layout state persisted during pattern switching
- Custom sizing (if user has resized areas) remembered
- Focus position maintained during layout changes

### Detailed Component Behavior in Hybrid Layout

#### Input/Output Areas
- **Large Screen**: Equal width, side by side
- **Small Screen**: Full width, stacked vertically
- Resizable in both layouts (drag handles)
- Maintain consistent styling across layouts
- Automatic height adjustment based on content

#### Pattern Selection
- **Large Screen**: Side panel with detailed pattern cards
- **Small Screen**: Dropdown menu or full-width command palette
- Consistent search functionality in both layouts
- Recently used patterns visible in both layouts

#### Action Controls
- **Large Screen**: Positioned between input/output with vertical orientation
- **Small Screen**: Horizontal toolbar below input area
- Same actions available in both layouts
- Keyboard shortcuts consistent across layouts

#### Command Palette
- Accessible via Cmd+K in all layouts
- Centered overlay in both layouts
- Adapts width based on screen size
- Consistent keyboard navigation

### Implementation Details

#### CSS Approach
- CSS Grid and Flexbox for layout switching
- Media queries for breakpoints
- CSS variables for consistent spacing
- Container queries for component-level responsiveness

#### State Management
- Layout state tracked in application state
- Window resize event listeners for adaptive changes
- Debounced resize handling for performance
- Layout preference stored in local storage

#### Accessibility Considerations
- Focus management adapted to current layout
- Tab order optimized for each layout
- ARIA attributes updated based on layout
- Screen reader announcements for layout changes

### Visual Examples

#### Large Screen (Split View)
```
+---------------------------------------------------+
|           Toolbar with Pattern Selection           |
+---------------------+-------------+----------------+
|                     |             |                |
|                     |  Transform  |                |
|                     |     ->      |                |
|      Input Area     |             |  Output Area   |
|                     |   Copy      |                |
|                     |             |                |
|                     |   Clear     |                |
+---------------------+-------------+----------------+
```

#### Small Screen (Stacked View)
```
+---------------------------------------------------+
|           Toolbar with Pattern Selection           |
+---------------------------------------------------+
|                                                   |
|                   Input Area                      |
|                                                   |
+---------------------------------------------------+
|         Transform | Copy | Clear Buttons          |
+---------------------------------------------------+
|                                                   |
|                  Output Area                      |
|                                                   |
+---------------------------------------------------+
```

### Benefits of the Hybrid Approach

1. **Optimal experience across devices** - Best layout for each screen size
2. **Reduced learning curve** - Familiar patterns for different contexts
3. **Improved accessibility** - Appropriate layouts for different input methods
4. **Future-proof design** - Adaptable to new devices and screen sizes
5. **User empowerment** - Preference options for personalization
6. **Consistent functionality** - Same features available in all layouts

## Accessibility Considerations
- High contrast between text and background
- Keyboard navigation for all functions
- Clear focus indicators
- Screen reader compatible labels and ARIA attributes
- Visible keyboard shortcuts on hover
- Resizable text for better readability