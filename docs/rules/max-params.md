<!--
  DO NOT EDIT. Generated from src/rules/max-params.ts and tests/rules/max-params/cases.ts.
  Run `pnpm update-rule-docs` to update it.
-->

# `@dr460nf1r3/max-params`

Limit undecorated function parameters; group them into a parameter object

- Type: suggestion
- Presets: `recommended`, `full`

## Rationale

Long parameter lists are easy to call in the wrong order and usually hide a concept that deserves a name. Decorated parameters are framework wiring (Nest route handlers) and constructor parameters are injected dependencies, which `max-dependencies` limits instead.

## Options

```json
[
  {
    "type": "object",
    "properties": {
      "max": {
        "type": "integer",
        "minimum": 0,
        "description": "Maximum number of undecorated parameters."
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
    "max": 3
  }
]
```

## Examples

These examples are the rule's test cases, so they match its current behaviour.

<details>
<summary>❌ Incorrect code</summary>

#### Reports four parameters and names them in the parameter-object hint

```ts
const price = (item, quantity, discount, currency) => item;
```

#### Honours the max option

Options: `[{"max":1}]`

```ts
function f(a, b) {}
```

</details>

<details>
<summary>✅ Correct code</summary>

#### Accepts three parameters

```ts
function price(item: string, quantity: number, discount: number) {}
```

#### Ignores decorated Nest handler parameters

```ts
class C { list(@User() user, @Param('id') id, @Query('q') q, @Body({ schema: s }) body, extra) {} }
```

#### Ignores constructors because they list injected dependencies

```ts
class C { constructor(a, b, c, d, e) {} }
```

</details>
