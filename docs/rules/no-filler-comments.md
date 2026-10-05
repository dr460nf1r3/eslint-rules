<!--
  DO NOT EDIT. Generated from src/rules/no-filler-comments.ts and tests/rules/no-filler-comments/cases.ts.
  Run `pnpm update-rule-docs` to update it.
-->

# `@dr460nf1r3/no-filler-comments`

Disallow filler phrasing and section-divider comments

- Type: suggestion
- Presets: `recommended`, `full`

## Rationale

Phrases like "This method", "simply", "note that" and "in order to" pad comments without adding information. Section dividers and labels such as `// --- Helpers ---` or `// Constructor` structure a file that is too big, when names and files should carry that structure instead.

## Options

The rule has no options.

## Examples

These examples are the rule's test cases, so they match its current behaviour.

<details>
<summary>❌ Incorrect code</summary>

#### Reports filler phrasing: /** This function loads the draft. */

```ts
/** This function loads the draft. */
const a = 1;
```

#### Reports filler phrasing: // This method is a helper to map lines

```ts
// This method is a helper to map lines
const a = 1;
```

#### Reports filler phrasing: // Helper to build the clause

```ts
// Helper to build the clause
const a = 1;
```

#### Reports filler phrasing: // Simply map the lines

```ts
// Simply map the lines
const a = 1;
```

#### Reports filler phrasing: // Basically the same mapping as B1 uses

```ts
// Basically the same mapping as B1 uses
const a = 1;
```

#### Reports filler phrasing: // Note that B1 rounds per line

```ts
// Note that B1 rounds per line
const a = 1;
```

#### Reports filler phrasing: // It is important to call this first

```ts
// It is important to call this first
const a = 1;
```

#### Reports filler phrasing: // In order to keep the order stable

```ts
// In order to keep the order stable
const a = 1;
```

#### Reports filler phrasing: // We need to sort before paging

```ts
// We need to sort before paging
const a = 1;
```

#### Reports filler phrasing: // Here we map the lines

```ts
// Here we map the lines
const a = 1;
```

#### Reports divider and label comments: // ---------- Helpers ----------

```ts
// ---------- Helpers ----------
const a = 1;
```

#### Reports divider and label comments: // ===========

```ts
// ===========
const a = 1;
```

#### Reports divider and label comments: // Imports

```ts
// Imports
const a = 1;
```

#### Reports divider and label comments: // Constructor

```ts
// Constructor
const a = 1;
```

#### Reports divider and label comments: // Lifecycle hooks:

```ts
// Lifecycle hooks:
const a = 1;
```

#### Reports divider and label comments: /* Getters */

```ts
/* Getters */
const a = 1;
```

</details>

<details>
<summary>✅ Correct code</summary>

#### Ignores quoted mentions of filler phrases

```ts
// Reports "Note that" and `simply` as padding
const a = 1;
```

#### Accepts plain explanatory comments

```ts
// B1 rounds per line, not per document
const a = 1;
```

</details>
