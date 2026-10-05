<!--
  DO NOT EDIT. Generated from src/rules/one-line-guard.ts and tests/rules/one-line-guard/cases.ts.
  Run `pnpm update-rule-docs` to update it.
-->

# `@dr460nf1r3/one-line-guard`

One-line guards for short jumps, braces for everything else

- Type: layout
- Presets: `lite`, `recommended`, `full`
- 🔧 Fixable with `--fix`

## Rationale

Short guards read as a single "leave here" step, while braces and extra lines make early exits look like regular logic. Only short jumps (`return`, `continue`, `break`, `throw`) that fit the print width may sit on the `if` line; every other body gets braces, because a one-line state change is easy to miss. A one-line `if` therefore always means "leave here".

## Options

```json
[
  {
    "type": "object",
    "properties": {
      "printWidth": {
        "type": "integer",
        "minimum": 1,
        "description": "Maximum line length a one-line guard may reach, usually Prettier's `printWidth`."
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
    "printWidth": 120
  }
]
```

## Examples

These examples are the rule's test cases, so they match its current behaviour.

<details>
<summary>❌ Incorrect code</summary>

#### Collapses a braced jump that fits into one line

```ts
function f(a) {
  if (!a) {
    return null;
  }
}
```

#### Collapses a jump that sits on its own line without braces

```ts
if (!a)
  return;
```

#### Braces a jump whose one-line form exceeds the print width

Options: `[{"printWidth":10}]`

```ts
if (!a) return;
```

#### Braces a one-line state change, keeping the indentation

```ts
function f() {
  if (isExport) total += freight;
}
```

#### Braces a jump whose returned value spans several lines

```ts
if (!a) return {
  ok: false,
};
```

</details>

<details>
<summary>✅ Correct code</summary>

#### Accepts one-line jumps, including returns with a value

```ts
function f(a, b) {
  if (!a) return;
  if (!b) return b.value;
  for (const x of a) {
    if (x) continue;
    if (!x) break;
  }
  if (a === b) throw new Error("same");
}
```

#### Keeps a braced jump that would not fit on one line

```ts
function f() {
  if (invoice.lines.some((line) => line.taxCode === code && line.amount > threshold && !line.isFreeText)) {
    throw new ValidationException('too long for one line');
  }
}
```

#### Keeps a braced state change

```ts
if (dirty) {
  save();
}
```

#### Ignores if/else, multi-statement bodies and bodies with comments

```ts
if (a) return 1;
else return 2;
if (b) {
  c();
  return;
}
if (d) {
  // keep the reason
  return;
}
```

</details>
