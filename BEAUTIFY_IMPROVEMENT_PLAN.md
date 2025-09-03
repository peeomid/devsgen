# Beautifier Improvements Plan

This plan addresses the issues observed in the language samples and upgrades SQL formatting. It also outlines testing adjustments to verify whole-output where feasible.

## Goals
- Improve SQL formatting: readable clauses, uppercase keywords, consistent indentation.
- Preserve current behavior for JSON (no validation) and PHP dump (aligned, readable).
- Avoid regressions in JS complete-output tests.
- Leave CSS/HTML/XML/YAML enhancements for a focused follow-up with specialized formatters.

## Findings (Current Output vs. Target)
- JavaScript: OK (whole-output match passes).
- JSON (No Validation): OK (tolerant pretty view; preserves trailing commas).
- PHP Dump: OK (indentation and `=>` spacing).
- SQL: Needs improvement (add clause line breaks, uppercase, indent).
- Python: Generic pass only (not syntax-aware; body indent not fixed).
- HTML/XML: Generic pass only (attribute spacing like `id =` undesired; no structural pretty-print).
- CSS: Generic pass only (spacing issues like `font - size`; needs semicolon-aware lines).
- YAML: Generic pass only (dashes/keys spacing; currently JSON-like blocks).

## Implementation Plan
1) Add SQL formatter
- Create `src/lib/beautify/sqlFormatter.ts` with a lightweight formatter:
  - Uppercase major keywords (SELECT, FROM, WHERE, JOIN variants, ON, GROUP BY, ORDER BY, LIMIT, OFFSET).
  - Line breaks before major clauses.
  - SELECT list split by commas with indentation.
  - JOIN blocks: separate lines for JOIN and ON; indent table and ON conditions.
  - WHERE: break OR/AND conditions to separate lines.
  - Spaces around operators `= <> != < <= > >=`.

2) Detection & routing
- Extend `Detected` type with `'sql'`.
- Update `detectType()` to detect SQL via simple heuristics (e.g., `SELECT ... FROM`, DML patterns).
- In `beautify()`, route `'sql'` inputs to `formatSql()`.

3) Tests
- Add `src/__tests__/beautify/sql-complete.test.ts` to assert whole-output for the sample query.
- Keep existing JS whole-output test intact.
- Retain partial assertions for CSS/HTML/XML/YAML until specialized formatters are introduced.
- Keep JSON and PHP dump tests verifying tolerant behavior and structured alignment.

4) Future follow-ups (separate PRs)
- CSS: newline after semicolons, avoid breaking hyphenated identifiers.
- HTML/XML: attribute spacing, structural pretty-print with an HTML/XML parser.
- YAML: indentation and list handling with a YAML-aware formatter.
- Python: optional rope/black-like formatting or language-aware rules (if desired).

5) HTML/XML/YAML improvements (this change)
- HTML:
  - Detection for HTML via tags/doctype.
  - Formatter that indents block-level elements, preserves attribute spacing as key="value", keeps simple inline spans on one line.
  - Whole-output test for nested elements sample.
- XML:
  - Detection for XML via `<?xml` or self-closing tags; formatter similar to HTML but no void elements list; self-closing `<tag />` rendering.
  - Whole-output test for nested elements sample.
- YAML:
  - Detection for YAML (no `{}` blocks required); avoid collisions with CSS.
  - Formatter that expands inline map syntax `key:{a: 1, b: 2}` to block style with proper 2-space indentation.
  - Whole-output test for config sample.

## Rollout
- This change is non-breaking for existing JS/JSON/PHP behaviors.
- SQL pages and samples gain markedly better readability.

## Validation
- Run unit tests (JS and SQL whole-output; JSON/PHP behavior; SEO sample smoke tests).
- Manually test `/tools/beautify/sql` sample for clause breaks, uppercase keywords, and indentation.
