<!--
  DO NOT EDIT. Generated from src/rules/no-comment-semicolon.ts and tests/rules/no-comment-semicolon/cases.ts.
  Run `pnpm update-rule-docs` to update it.
-->

# `@dr460nf1r3/no-comment-semicolon`

Disallow semicolons in comment prose

- Type: suggestion
- Presets: `recommended`, `full`

## Rationale

Generated comments chain clauses with semicolons constantly, which makes them read like generated text and usually packs two thoughts into one line. Code inside backticks, fenced blocks and `@example`, HTML entities, directives and commented-out code are skipped, so only prose semicolons are reported.

## Options

The rule has no options.

## Examples

These examples are the rule's test cases, so they match its current behaviour.

<details>
<summary>❌ Incorrect code</summary>

#### Reports semicolons joining clauses in line comments

```ts
// B1 rounds per line; the header total is derived
const a = 1;
```

#### Reports every semicolon in JSDoc prose

```ts
/**
 * Loads the draft; falls back to the base document; never throws.
 */
function load() {}
```

#### Points at the semicolon itself

```ts
const a = 1; // cached; refreshed hourly
```

</details>

<details>
<summary>✅ Correct code</summary>

#### Ignores semicolons inside backtick code spans and HTML entities

```ts
/** Call `load(); render();` in that order, separated by &nbsp; a space. */
const a = 1;
```

#### Ignores @example blocks and fenced code

````ts
/**
 * Builds the clause.
 * @example
 * const sql = build(); run(sql);
 */
function build() {}
/**
 * ```ts
 * a(); b();
 * ```
 */
const x = 1;
````

#### Ignores directives and commented-out code

```ts
// eslint-disable-next-line no-console -- debug; temporary
console.log(1);
// const total = sum(lines);
const a = 1;
```

</details>
