<!--
  DO NOT EDIT. Generated from src/rules/comment-style.ts and tests/rules/comment-style/cases.ts.
  Run `pnpm update-rule-docs` to update it.
-->

# `@dr460nf1r3/comment-style`

Use // for single-line and /** */ for multi-line comments

- Type: layout
- Presets: `lite`, `recommended`, `full`
- 🔧 Fixable with `--fix`

## Rationale

One comment style means the style itself carries no meaning: `//` for a single line and `/** */` for anything longer, which editors fold and reflow as one block. Plain block comments and stacked `//` lines are converted automatically when they stand on their own lines, while inline block comments between tokens are only reported because there is no safe rewrite.

## Options

The rule has no options.

## Examples

These examples are the rule's test cases, so they match its current behaviour.

<details>
<summary>❌ Incorrect code</summary>

#### Turns a one-line block comment into //

```ts
/* Year */
const year = 2026;
```

#### Turns a multi-line block comment into JSDoc

```ts
/*
 * B1 rounds per line,
 * not per document.
 */
const total = 1;
```

#### Turns a run of // lines into one JSDoc block at the same indentation

```ts
function f() {
  // B1 returns the gross price here,
  // so the net price is derived.
  return 1;
}
```

#### Reports but does not fix an inline block comment between tokens

```ts
call(1 /* Year */, 2);
```

</details>

<details>
<summary>✅ Correct code</summary>

#### Accepts single // lines, JSDoc, directives and license headers

```ts
/*! (c) part */
/* eslint-disable no-console */
/** Doc. */
const a = 1; // trailing
// single line
const b = 2;
```

#### Does not join // lines separated by code or directives

```ts
// one
const a = 1;
// two
// eslint-disable-next-line
const b = 2;
```

</details>
