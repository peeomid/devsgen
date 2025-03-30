## Project Context
- This is part of a larger developer utilities site that will contain multiple tools
- Regex Helper is the first tool in this collection
- The site will follow programmatic SEO principles, where each tool and each regex pattern has its own dedicated page with descriptions and SEO content
- Within a tool, the experience should be client-side (no page refreshes when switching between patterns)
- Page refreshes are acceptable when switching between different tools
- The project will be open-sourced. Each tool's directory in the GitHub repository will contain a `README.md` file to serve as an additional SEO channel when rendered by GitHub.

## Use cases
I want to create a simple regex helper tool to help with regular dev tasks:
- Normally I copy a lot of python path, like `app.services.sub` and want to change it to `app/services/sub` or reverse.
- I have a list of items on multiple lines, and want to join them into comma separated string, sometimes I need to add " or ' to each item, sometimes don't need.

## Preferences
- UI: simple, minimalistic
- There should be a big textarea for input and output, and a button to quickly copy result.
- Quick way to select regex pattern, each pattern should have a name field, that I can search
- Can quickly add new regex pattern, and test while adding it
- Each pattern should have search and replace regex, name, description, and example of from and to
- It should be easy to use, even without mouse cursor, but can work with keyboard shortcuts
- Follow common developer tool patterns:
  - Command+K to open command palette/search (for pattern selection)
  - Keyboard-focused workflow that minimizes mouse usage
  - Clear indication of available shortcuts
  - Intuitive flow from input to output to copying results

## Tech
- Patterns for now are stored in json file with all fields
- Use current astro build site
- Each tool and pattern should have its own URL for SEO purposes
- Client-side functionality within each tool

## Pattern Management
- An initial library of regex patterns will be provided via a JSON file loaded by the client.
- Users can add their own custom patterns.
- Custom patterns added by the user will be stored locally using `localStorage`.
- Pattern search functionality (e.g., via Command+K) must combine results from both the server-provided JSON library and the user's `localStorage`.
- Users must have an option to view and export all patterns currently stored in their `localStorage` (e.g., as a JSON download).
- Users must have an option to import patterns from a JSON file into their `localStorage`.