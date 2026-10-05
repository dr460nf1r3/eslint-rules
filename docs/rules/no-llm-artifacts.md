<!--
  DO NOT EDIT. Generated from src/rules/no-llm-artifacts.ts and tests/rules/no-llm-artifacts/cases.ts.
  Run `pnpm update-rule-docs` to update it.
-->

# `@dr460nf1r3/no-llm-artifacts`

Disallow placeholder comments and not-implemented stubs

- Type: problem
- Presets: `lite`, `recommended`, `full`

## Rationale

Code generators leave placeholders behind: elision markers such as "... existing code ..." or "omitted for brevity" mean code was skipped or truncated and the file may be incomplete. Functions that only throw "not implemented" compile and pass review but fail at runtime.

## Options

The rule has no options.

## Examples

These examples are the rule's test cases, so they match its current behaviour.

<details>
<summary>❌ Incorrect code</summary>

#### Reports // ... existing code ...

```ts
// ... existing code ...
const a = 1;
```

#### Reports // rest of the method remains the same

```ts
// rest of the method remains the same
const a = 1;
```

#### Reports // TODO: implement

```ts
// TODO: implement
const a = 1;
```

#### Reports /* omitted for brevity */

```ts
/* omitted for brevity */
const a = 1;
```

#### Reports // your code here

```ts
// your code here
const a = 1;
```

#### Reports // same as above

```ts
// same as above
const a = 1;
```

#### Reports a not-implemented stub

```ts
function price() { throw new Error('Not implemented'); }
```

</details>

<details>
<summary>✅ Correct code</summary>

#### Accepts ordinary comments

```ts
// B1 rounds per line
const a = 1;
```

</details>
