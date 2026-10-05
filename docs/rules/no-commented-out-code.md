<!--
  DO NOT EDIT. Generated from src/rules/no-commented-out-code.ts and tests/rules/no-commented-out-code/cases.ts.
  Run `pnpm update-rule-docs` to update it.
-->

# `@dr460nf1r3/no-commented-out-code`

Disallow commented-out code

- Type: suggestion
- Presets: `lite`, `recommended`, `full`

## Rationale

Dead code in comments rots, confuses readers about what actually runs, and git already keeps the history. A comment counts as code when its text parses as more than a bare word or label, and consecutive `//` lines are judged together so a commented-out block is reported once.

## Options

The rule has no options.

## Examples

These examples are the rule's test cases, so they match its current behaviour.

<details>
<summary>❌ Incorrect code</summary>

#### Reports commented-out statements

```ts
// const total = lines.reduce((sum, line) => sum + line.price, 0);
const a = 1;
```

#### Groups a run of commented-out lines into one report

```ts
// if (x) {
//   doThing(x);
// }
const a = 1;
```

#### Reports commented-out code in block comments

```ts
/* this.load(); */
const a = 1;
```

</details>

<details>
<summary>✅ Correct code</summary>

#### Accepts prose, single words, TODOs and URLs

```ts
// B1 rounds per line, not per document
// Year
// TODO: remove after migration
// https://help.sap.com/x
/** @param x The value. */
const a = 1;
```

</details>
