# PHP var_dump Formatting – Improvement Plan

## Goal (Brief)
Produce the exact var_dump style below, consistently, via a lightweight post‑processor layered on top of the unified formatter (beautify → BracketFormatterService):
From:
```
// PHP var_dump-ish
array(2) {
  ["id"]=>
  int(42)
  ["tags"]=>
  array(3) { [0]=> string(3) "one" [1]=> string(3) "two" [2]=> string(5) "three" }
}
```

To

```
array(2) {
  ["id"] => int(42)
  ["tags"] => array(3) { 
    [0] => string(3) "one" 
    [1] => string(3) "two" 
    [2] => string(5) "three" 
  }
}
```

## Approach (High‑Level)
- Keep BracketFormatterService generic for all languages.
- When input is detected as `phpVarDump`, apply a var_dump‑aware post‑processor to the formatted output to enforce precise spacing and line breaks.
- Wire this post‑processor inside `beautify()` so the UI (vanilla + worker) and tests get the same result.

## Files & Changes (Concise)
- `src/lib/beautify/beautify.ts`
  - Detect type at start (`detectType(text)`), still run base `BracketFormatterService.format(text, indentStr)`.
  - If detected is `phpVarDump`: `output = formatPhpVarDump(output, indentStr)`.
  - Return as usual with diagnostics and trailing newline.

- `src/lib/beautify/phpVarDump.ts` (new)
  - `export function formatPhpVarDump(text: string, indentStr: string): string`
  - Stateless post‑processor that enforces var_dump layout rules (below).

## Var Dump Rules (Concise)
- Spacing
  - Ensure single spaces around `=>`: `["key"] => value`.
  - Ensure single space before `{` in `array(n) {`.
- Line breaks
  - Each `[index] => value` pair must be on its own line.
  - Primitive values stay on the same line as the key: `int(42)`, `string(3) "one"`, `float(...)`, `bool(...)`, `NULL`.
  - Nested arrays: keep `array(n) {` on same line as the key; contents on the next lines, indented by one level, then close `}` on its own line.
  - When multiple pairs appear on the same physical line (e.g. `[0]=>string(3)"one"[1]=>…`), split them into separate lines using a regex‑driven scan.
- Indentation
  - Use `indentStr` per depth level.

## Parsing Strategy (Simple & Robust)
- Tokenize by scanning characters while respecting quotes and escapes.
- Recognize markers:
  - `array(\d+)\s*\{` opener and `}` closer (manage depth).
  - Key/value boundary: `/\[.*?\]\s*=>/` outside strings.
  - Primitive value patterns: `int\(\d+\)`, `string\(\d+\)\s*"[^"]*"`, `float\([^)]*\)`, `bool\([^)]*\)`, `NULL`.
- Emit lines:
  - On encountering a key boundary, flush the previous pair (if any) and start a new line with current depth.
  - After emitting a primitive value, end the line.
  - For nested array value, emit `array(n) {` on same line, then increase depth; on `}` emit a newline with reduced depth.

## Tests (Add/Adjust)
- File: `src/lib/beautify/__tests__/var_dump.spec.ts`
  - Case: “formats the provided var_dump sample exactly”
    - Input (even with dense single‑line values inside the nested array), Expect exactly:
      - array(2) {\n
        ["id"] => int(42)\n
        ["tags"] => array(3) {\n
          [0] => string(3) "one"\n
          [1] => string(3) "two"\n
          [2] => string(5) "three"\n
        }\n
      }\n
  - Case: ensures `array(n) {` spacing: no missing space before `{`.
  - Case: multiple pairs on one physical line are split into separate lines.

- File: `src/__tests__/services/BeautifyWorkerService.test.ts`
  - Case: End‑to‑end through worker returns exact expected var_dump output for the sample input.

## Compare With Current Behavior
- Current
  - `beautify()` formats via `BracketFormatterService`, adds some PHP awareness (don’t break `int(42)`, space handling for `=>`).
  - It does not explicitly split concatenated `[idx]=>value` pairs into separate lines, nor guarantee `array(n) {` spacing.
  - Result: var_dump blocks can appear crammed on one line when the source has no commas/newlines between entries.

- Planned
  - Add a focused post‑processor for `phpVarDump` that:
    - Splits concatenated pairs into distinct lines.
    - Normalizes spacing around `=>` and before `{`.
    - Preserves primitive values on the same line and indents nested arrays.
  - Wired into `beautify()` so the worker/UI and tests get identical, precise output.

## Rollout
- Implement `formatPhpVarDump()` and integrate in `beautify()` behind detection.
- Update/add tests (unit + worker E2E) to assert exact expected output.
- Verify UI sample produces the desired format, even with dense inline inputs.

