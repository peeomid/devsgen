# Bracket Formatter Multiline Plan

## Objective
- Expand Python-style constructor calls and similar parenthesized argument lists across multiple lines when they contain long or complex values.
- Preserve existing behavior for genuinely simple inline calls, arrays, and other bracketed structures.

## Current Gaps
- Parentheses blocks are always flagged as inline because `shouldIndent` is forced to `false` for `(`.
- Commas inside parentheses never trigger a newline (`shouldBreakAfterComma` early-returns `false`).
- Closing parentheses rely on inline heuristics and ignore any contextual desire for multiline formatting.
- Array indentation heuristic only considers nested structures, so long primitive arrays remain inline.

## Proposed Fix Strategy
1. **Bracket Context Tracking**
   - Maintain a stack of metadata for each opener (`{`, `[`, `(`) capturing type and whether it should format multiline.
   - When encountering an opener, inspect ahead (up to its matching closer or a configurable limit) to detect cues: assignments (`=` or `=>`), nested brackets, or overall length above a threshold.
   - For `(` blocks wrapping keyword arguments or nested content, mark the context as multiline when cues are present.

2. **Opening-Bracket Handling**
   - After pushing context, if marked multiline, insert `pushIndent()` immediately so the next token starts on a new line with increased depth.
   - Allow arrays to leverage the same metadata, expanding the heuristic in `shouldIndentArray` to consider length and nested tuples/objects when deciding multiline.

3. **Comma Processing Adjustments**
   - Update `shouldBreakAfterComma` to consult the context stack instead of raw opener detection; break lines when the current context is multiline regardless of bracket type.
   - Ensure inline contexts still add a single space after commas for readability.

4. **Closing-Bracket Alignment**
   - Modify `shouldIndentClosingBracket` (or equivalent logic) to force a newline before `)`/`]` when their context is multiline.
   - Align the closing bracket indentation with the depth for that context and trim any stray inline spaces.

5. **Whitespace & Operator Guardrails**
   - Double-check operator spacing and colon handling inside multiline parentheses so we do not introduce double spaces or lose alignment.

## Validation Plan
- Run `npm run test -- prettyByBrackets` to ensure all constructor-focused tests (new and existing) pass.
- Spot-check other formatter suites if available to confirm no regressions in PHP or JSON formatting.
