<!--
  DO NOT EDIT. Generated from src/rules/max-dependencies.ts and tests/rules/max-dependencies/cases.ts.
  Run `pnpm update-rule-docs` to update it.
-->

# `@dr460nf1r3/max-dependencies`

Limit injected dependencies per class (single responsibility)

- Type: suggestion
- Presets: `recommended`, `full`
- Targets: Angular, NestJS

## Rationale

Each injected dependency is a reason to change, so a long dependency list is the most reliable sign of a class with several responsibilities. The rule counts constructor parameters and `inject(...)` field initializers together, and only for classes a DI container creates (Nest or Angular).

## Options

```json
[
  {
    "type": "object",
    "properties": {
      "max": {
        "type": "integer",
        "minimum": 0,
        "description": "Maximum number of constructor parameters plus `inject()` fields."
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
    "max": 5
  }
]
```

## Examples

These examples are the rule's test cases, so they match its current behaviour.

<details>
<summary>❌ Incorrect code</summary>

#### Counts inject() fields and constructor parameters together

```ts
@Injectable() class InvoiceService { dep0 = inject(Dep0);
dep1 = inject(Dep1);
dep2 = inject(Dep2); constructor(private a: A, private b: B, private c: C) {} }
```

</details>

<details>
<summary>✅ Correct code</summary>

#### Accepts five injected fields

```ts
@Service() class InvoiceService { dep0 = inject(Dep0);
dep1 = inject(Dep1);
dep2 = inject(Dep2);
dep3 = inject(Dep3);
dep4 = inject(Dep4); }
```

#### Ignores classes the DI container does not create

```ts
class Money { constructor(a, b, c, d, e, f) {} }
```

</details>
