# Code Beautify SEO Plan

This plan defines SEO pages for a Code Beautify tool, organized by hub, language, and workflow use cases. Each page includes a distinct title, H1, meta description, primary intent, a short copy angle, a sample input matching its use case, and a test plan note to verify output behavior. Implementation is out of scope here; this is the blueprint and verification plan only.

## Objectives
- Increase qualified traffic by targeting language/workflow-specific intents.
- Capture long-tail queries (e.g., "beautify sql joins", "format minified js").
- Improve conversion with clear CTAs (use tool, CLI/API) and trust cues.

## Architecture & Conventions
- Hub-and-spoke under `/tools/beautify/` (aligns with existing site: `/tools/...`).
- Use plain `<a href>` anchors (Astro static pages) for internal links.
- Self-canonical pages via `BaseLayout` canonical handling; avoid duplicate content across spokes.
- Unique H1s, meta descriptions, examples, and FAQs per page.
- JSON page explicitly does NOT validate and accepts malformed JSON.
- Componentization: Extract a shared `BeautifierUI` Astro component (with its client script) used by hub and all spokes so functional updates propagate everywhere.

---

## Pages

### 1) Hub — `/tools/beautify/`
- Title: Online Code Beautifier | Pretty Print, Format, Validate
- H1: Online Code Beautifier
- Meta: Beautify and format code instantly. Auto-detects JSON, Python, PHP, JavaScript and more. Handles malformed syntax that other formatters reject.
- Primary intent: General “beautify code online” queries.
- Copy angle: Fast, private, multi-language; clear paths to language/workflow pages.
- Sample input:
  ```txt
  {'name': 'Alice', 'items': [1,2,3,], 'active': true, 'config': {'theme': 'dark', 'lang': 'en'}}
  ```
- Test plan note: Verify default beautification improves indentation and spacing; confirm hub links to top spokes.

### 2) JavaScript — `/tools/beautify/javascript/`
- Title: JavaScript Beautifier | JS Code Formatter Online
- H1: JavaScript Beautifier
- Meta: Format messy JavaScript instantly. Fix indentation, add missing semicolons, normalize quotes. Works with minified JS, ESLint-friendly output.
- Primary intent: JS developers beautifying minified or messy JS.
- Copy angle: Sensible defaults, option to match ESLint/Prettier style.
- Sample input:
  ```js
  const x={a:1,b:[1,2,3]};function sum(a,b){return a+b};console.log(sum(1,2))
  ```
- Test plan note: Expect consistent indentation, statement semicolons normalized, and spaces around operators.

### 3) Python — `/tools/beautify/python/`
- Title: Python Formatter | PEP 8-Compliant Code Beautifier
- H1: Python Code Formatter
- Meta: PEP 8-compliant Python formatter. Auto-fix indentation, line length, imports, and quotes. Paste code or batch format files.
- Primary intent: Format Python to PEP 8 style.
- Copy angle: Safe defaults, black/autopep8-like output.
- Sample input:
  ```py
  def add(a,b):
   return a+b
  
  class T: pass
  ```
- Test plan note: Expect 4-space indent, blank line rules, and consistent quote normalization.

### 4) HTML — `/tools/beautify/html/`
- Title: HTML Beautifier | Pretty Print HTML Markup
- H1: HTML Beautifier
- Meta: Beautify HTML with clean indentation and consistent attributes. Handles inline CSS/JS and minified markup. Paste or upload.
- Primary intent: Improve readability of HTML files/snippets.
- Copy angle: Handles inline scripts/styles; preserves semantics.
- Sample input:
  ```html
  <div><span class="n">Hi</span><ul><li>1</li><li>2</li></ul></div>
  ```
- Test plan note: Expect nested indentation and attributes preserved; line breaks between block elements.

### 5) CSS — `/tools/beautify/css/`
- Title: CSS Formatter | Beautify or Minify CSS
- H1: CSS Beautifier & Minifier
- Meta: Format or minify CSS in one click. Fix indentation, brace style, and ordering. Optionally compress for production.
- Primary intent: Readable dev output or compressed prod CSS.
- Copy angle: Toggle between beautify/minify; consistent brace/colon spacing.
- Sample input:
  ```css
  body{margin:0;padding:0}h1{font-size:2rem;color:#333}
  ```
- Test plan note: Beautify inserts line breaks and indentation; minify removes whitespace without changing semantics.

### 6) JSON — `/tools/beautify/json/`
- Title: JSON Formatter | Pretty Print JSON (No Validation)
- H1: JSON Formatter (Does Not Validate)
- Meta: Format broken JSON that other tools reject. Handles missing quotes, trailing commas, and malformed syntax. No validation errors - just formatting.
- Primary intent: Users with not-quite-correct JSON who need readability, not strict validation.
- Copy angle: Tolerant formatter; does not validate; aims to help inspect data even when invalid.
- Sample input (intentionally invalid JSON):
  ```json
  {foo: 'bar', items: [1,2,], trailing: true,}
  ```
- Test plan note: Ensure the page does not reject malformed input; verify a best-effort pretty view is produced (e.g., tolerant parsing or safe visualization) and no “invalid JSON” error is shown.

### 7) SQL — `/tools/beautify/sql/`
- Title: SQL Formatter | Beautify SQL Queries
- H1: SQL Query Formatter
- Meta: Beautify SQL with keyword casing, indentation, and aligned JOINs. Supports MySQL, Postgres, SQL Server, and more.
- Primary intent: Readable SQL for reviews, debugging, and learning.
- Copy angle: Keyword uppercasing, JOIN alignment, subquery indentation.
- Sample input:
  ```sql
  select u.id,u.name,o.id as oid from users u join orders o on u.id=o.user_id where o.status='paid' order by o.created_at desc
  ```
- Test plan note: Expect uppercase keywords, line breaks before JOIN/WHERE/ORDER BY, and aligned conditions.

### 8) XML — `/tools/beautify/xml/`
- Title: XML Formatter | Pretty Print & Validate XML
- H1: XML Formatter & Validator
- Meta: Pretty print XML and validate with helpful error messages. Supports namespaces, CDATA, and large files.
- Primary intent: Readable, validated XML for config and data exchange.
- Copy angle: Safe pretty print; optional schema validation if available.
- Sample input:
  ```xml
  <root><item id="1"><name>A</name></item><item id="2"/></root>
  ```
- Test plan note: Expect hierarchical indentation; self-closing tags respected; optional validation path tested separately.

### 9) YAML — `/tools/beautify/yaml/`
- Title: YAML Formatter | Beautify YAML for Kubernetes & Helm
- H1: YAML Beautifier
- Meta: Beautify and lint YAML with consistent indentation. Great for Kubernetes, Helm charts, and CI configs.
- Primary intent: Clean, consistent YAML for infra configs.
- Copy angle: Indentation fixes; key ordering optionally preserved.
- Sample input:
  ```yaml
  apiVersion: v1
  kind: ConfigMap
  metadata:{name: app-cm}
  data:{LOG_LEVEL: debug, TIMEOUT: "30"}
  ```
- Test plan note: Expect normalized indentation and mapping style; keys preserved; block style applied.

### 10) Minified Code — `/tools/beautify/minified/`
- Title: Beautify Minified Code | Make Minified Code Readable
- H1: Beautify Minified Code
- Meta: Unminify JavaScript, CSS, HTML instantly. Restore readable formatting from compressed production code. Works with any minified syntax.
- Primary intent: One-off readability of minified assets.
- Copy angle: Language-agnostic minified detection; best-effort formatting.
- Sample input:
  ```txt
  (function(){function n(n){return n*n}console.log(n(5))})();
  ```
- Test plan note: Expect line breaks and indentation restored; function bodies readable; no semantic changes implied.

### 11) Bulk — `/tools/beautify/bulk/`
- Title: Bulk Code Beautifier | Format Multiple Files
- H1: Bulk Code Beautifier
- Meta: Format many files at once. Drag-and-drop folders or use CLI for batch code beautification across languages.
- Primary intent: Teams and projects needing consistent formatting en masse.
- Copy angle: Folder upload, ZIP handling, or CLI usage.
- Sample input (CLI-like batch spec for tests):
  ```txt
  files:
    - src/app.js
    - src/styles.css
    - api/schema.sql
  ```
- Test plan note: Verify multiple files are processed; each file’s output meets its language’s rules; report summarizes successes/failures.

### 12) Git Diff — `/tools/beautify/git-diff/`
- Title: Beautify Git Diffs | Format Changed Lines Only
- H1: Git Diff Beautifier
- Meta: Format only changed lines from your Git diffs to keep PRs clean. CI-friendly, no massive reformatting churn.
- Primary intent: Clean diffs and minimal churn in PRs.
- Copy angle: Changed-lines-only formatting; CI integration.
- Sample input (unified diff):
  ```diff
  diff --git a/app.js b/app.js
  --- a/app.js
  +++ b/app.js
  @@ -1,3 +1,3 @@
  -function add(a,b){return a+b}
  +function add(a, b) {
  +  return a + b;
  +}
  ```
- Test plan note: Confirm only added/changed lines are formatted; unchanged context remains identical.

### 13) PHP Dump — `/tools/beautify/php-dump/`
- Title: PHP Dump Formatter | Beautify var_dump and print_r Output
- H1: PHP Dump Beautifier
- Meta: Make messy PHP var_dump output readable. Align keys, indent nested arrays, and preserve types. Perfect for debugging complex data structures.
- Primary intent: Make PHP diagnostic output readable and shareable.
- Copy angle: Align keys/values; collapse/expand; large-output friendly.
- Sample input (raw var_dump):
  ```txt
  array(2) {
    ["user"]=>
    array(3) {
      ["id"]=>
      int(42)
      ["name"]=>
      string(5) "Alice"
      ["roles"]=>
      array(2) {
        [0]=>
        string(5) "admin"
        [1]=>
        string(4) "user"
      }
    }
    ["active"]=>
    bool(true)
  }
  ```
- Test plan note: Expect indentation, alignment, and collapsible sections; verify types (int, string, bool) are preserved in the rendered view.

---

## Page Blueprints (shared structure)
- Above the fold: H1, short value prop (page-specific), primary CTA “Beautify Code”, secondary “Try CLI/API”.
- Input module: Paste/upload, file type detection, example quick-fill (use sample inputs above).
- Config presets: Language-relevant options (quotes, line width, keyword case, etc.). Safe defaults and reset.
- Results: Side-by-side diff; copy/download/share; time-to-first-result note.
- SEO copy: Use-case paragraph, “How it works” bullets (3–5), best practices, and 5–7 FAQs tuned to the intent.
- Trust & conversion: Privacy statement; social proof; docs links (CLI/API); cross-links to related pages.

## On-Page Optimization
- Title tags: 50–60 chars; primary key phrase first; brand optional at end.
- H1: Match intent; avoid repeating title verbatim.
- Meta descriptions: 140–160 chars; benefit + feature + CTA.
- Headings: H2/H3 with semantic variations; include relevant synonyms.
- FAQ: Conversational questions to match People Also Ask.
- Content uniqueness: Distinct examples, presets, and tips on each page.

## Internal Linking (Aligned with current site)
- Header nav: Keep minimal. Optionally add `Code Beautifier` linking to `/tools/beautify` next to `Regex Helper` and `Line Filter` (matches BaseLayout styling). If not added, ensure discoverability via `/tools` and cross-links.
- Tools index: Ensure the card for `Code Beautifier` points to `/tools/beautify` (already present). Hub will surface spokes via cards.
- Breadcrumbs: Use the existing breadcrumb pattern used by Regex pages.
  - Structure: `Home › Tools › Code Beautifier › {Spoke Title}`.
  - Implementation: plain `<a href>` anchors with `hover:text-primary` classes within a `<nav aria-label="Breadcrumb">`.
- Hub page: Add a “Formats & Workflows” grid linking to spoke pages (language/workflow cards). Provide short descriptors under each link.
- Spoke pages:
  - Breadcrumb back to hub.
  - Add a “Related Formats” section (same markup pattern as `Related Patterns` in Regex pages) linking to 4–6 adjacent spokes (e.g., JSON → YAML, XML; JavaScript → Minified, CSS; PHP Dump → JSON, YAML).
  - Include a compact “See also” block at the end linking back to hub and to `/tools`.
- Footer: Leave as-is (no long link lists). Avoid clutter; rely on hub, breadcrumbs, and related blocks.
- Canonicals: Let `BaseLayout` set self-canonical for each spoke; if any aliases exist, set `canonicalUrl` to the primary path.

## Technical & Schema
- Schema: FAQPage for FAQs; WebPage; SoftwareApplication on hub when applicable; BreadcrumbList for nav.
- Performance: Fast TTFB, defer non-essential scripts, code-split heavy formatters.
- Indexing: Robots index/follow; sitemap includes all pages; hreflang if multilingual.
- Canonicals: Self-canonicals; avoid parameter duplicates.
- UX: Persist settings via localStorage; safe handling of large pastes.

## Measurement
- Events: Beautify click, copy/download, settings changes, example used, time-to-first-result.
- Conversions: Tool usage → CLI/API docs → signup/download.
- Reporting: CTR, bounce, conversions per page; track rankings by cluster.

## Rollout Plan
- Phase 1: Hub + 6 language pages (JS, Python, HTML, CSS, JSON, SQL) + Minified + PHP Dump.
- Phase 2: XML, YAML, Bulk, Git Diff + API docs linkage.
- Phase 3: Persona pages, internationalization, and link building.

Implementation note: Refactor existing `/tools/beautify` page to use the shared component before adding spokes; each spoke passes page-specific sample input to the component.

---

## Verification & Tests
For each page, create automated tests using the provided Sample Input. Tests verify output characteristics (not necessarily byte-for-byte equality unless deterministic) and that the UI behaves according to intent.

- Hub: Beautifies generic JS snippet; ensures internal links render.
- JavaScript: Indentation and semicolons added; operator spacing normalized.
- Python: 4-space indentation; newline rules; quote normalization.
- HTML: Proper nesting and line breaks between block elements.
- CSS: Beautify adds line breaks/indentation; minify removes whitespace with identical semantics.
- JSON (No Validation): Does not reject malformed input; renders a best-effort prettified or visualized output; no validation errors shown.
- SQL: Uppercase keywords; line breaks at JOIN/WHERE/ORDER BY; aligned conditions.
- XML: Pretty-printed with optional validation pathway; preserves self-closing tags.
- YAML: Normalized indentation/mapping; preserves keys and values; block style enforced.
- Minified: Line breaks and indentation restored; functions readable; no behavioral changes implied.
- Bulk: Processes multiple files; per-file output meets language rules; roll-up summary present.
- Git Diff: Formats only changed lines; unchanged context stays untouched.
- PHP Dump: Keys/values aligned; nested structures collapsible; types retained in display.

Test harness note: For tolerant pages (e.g., JSON No-Validation, PHP Dump), assert presence of structured output (e.g., tree view, aligned key-value pairs) rather than strict parse success.
