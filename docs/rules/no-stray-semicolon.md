<!--
  DO NOT EDIT. Generated from src/rules/no-stray-semicolon.ts and tests/rules/no-stray-semicolon/cases.ts.
  Run `pnpm update-rule-docs` to update it.
-->

# `@dr460nf1r3/no-stray-semicolon`

Disallow empty statements and stray semicolons

- Type: suggestion
- Presets: `lite`, `recommended`, `full`
- 🔧 Fixable with `--fix`

## Rationale

Extra semicolons are noise left by copy-paste or generated code and hide where statements really end, so `;;`, `};` after declarations and stray `;` between class members are removed automatically. An empty statement as the body of `if`, `while` or `for` is reported without a fix, because `if (ready);` almost always means the intended body was lost.

## Options

The rule has no options.

## Examples

These examples are the rule's test cases, so they match its current behaviour.

<details>
<summary>❌ Incorrect code</summary>

#### Reports and removes doubled semicolons

```ts
const a = 1;;
```

#### Reports and removes semicolons after function and class declarations

```ts
function f() {};
class B {};
```

#### Reports and removes stray semicolons inside class bodies

```ts
class A { x = 1;; m() {}; }
```

#### Reports an empty if/loop body without fixing it, since it is usually a bug

```ts
if (ready);
while (next());
```

</details>

<details>
<summary>✅ Correct code</summary>

#### Accepts ordinary statement terminators and for(;;) headers

```ts
const a = 1;
for (let i = 0; i < 3; i++) {}
for (;;) { break; }
class A { x = 1; m() {} }
```

</details>
