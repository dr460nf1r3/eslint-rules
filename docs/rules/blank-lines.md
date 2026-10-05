<!--
  DO NOT EDIT. Generated from src/rules/blank-lines.ts and tests/rules/blank-lines/cases.ts.
  Run `pnpm update-rule-docs` to update it.
-->

# `@dr460nf1r3/blank-lines`

Blank lines before returns by block size, none between a declaration and the statement reading it

- Type: layout
- Presets: `lite`, `recommended`, `full`
- 🔧 Fixable with `--fix`

## Rationale

Prettier keeps blank lines but never adds or removes them, so their placement drifts. This rule fixes two cases: a `return` gets a blank line before it in blocks of three or more statements and none in shorter ones, and a statement that reads the variable declared directly above it stays attached to that declaration. After an `if`, a loop or a block it defers to `@stylistic/padding-line-between-statements`, which the presets configure to require a blank line there. Comments between statements are left alone.

## Options

```json
[
  {
    "type": "object",
    "properties": {
      "attachConnected": {
        "type": "boolean",
        "description": "Keep a statement attached to the declaration it reads. The presets set it to `false` in test files, so setup and assertions stay apart."
      }
    },
    "additionalProperties": false
  }
]
```

Defaults:

```json
[
  {
    "attachConnected": true
  }
]
```

## Examples

These examples are the rule's test cases, so they match its current behaviour.

<details>
<summary>❌ Incorrect code</summary>

#### Adds a blank line before the return of a longer block

```ts
function f() {
  const items = load();
  log(items.length);
  return items;
}
```

#### Removes the blank line before the return of a two-statement block

```ts
function f() {
  log(1);

  return 2;
}
```

#### Attaches a statement to the declaration it reads

```ts
function f() {
  const result = run();

  expect(result).toBe(1);
}
```

#### Attaches a return to the declaration it reads, even in a longer block

```ts
function f() {
  setup();
  const total = sum(items);

  return total;
}
```

</details>

<details>
<summary>✅ Correct code</summary>

#### Keeps a two-statement block compact

```ts
function f() {
  const total = sum(items);
  return total;
}
```

#### Sets the return apart in a block of three statements

```ts
function f() {
  const items = load();
  log(items.length);

  return items;
}
```

#### Leaves statements after an if, a loop or a block to @stylistic

```ts
function f() {
  if (!a) return 0;

  for (const x of a) use(x);
  return 1;
}
```

#### Leaves blank lines with a comment in between alone

```ts
function f() {
  const items = load();
  log(items);
  // The caller owns the list.
  return items;
}
```

#### Lets setup and assertions stay apart when attachConnected is off

Options: `[{"attachConnected":false}]`

```ts
function f() {
  const result = run();

  expect(result).toBe(1);
}
```

#### Checks switch cases like blocks

```ts
switch (a) {
  case 1:
    const b = a + 1;
    return b;
}
```

</details>
