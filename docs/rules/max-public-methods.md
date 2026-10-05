<!--
  DO NOT EDIT. Generated from src/rules/max-public-methods.ts and tests/rules/max-public-methods/cases.ts.
  Run `pnpm update-rule-docs` to update it.
-->

# `@dr460nf1r3/max-public-methods`

Limit public methods per class (interface segregation)

- Type: suggestion
- Presets: `recommended`, `full`

## Rationale

A wide public surface forces every caller to depend on methods it never uses and hides several responsibilities in one class (interface segregation). Accessors, private and protected members and Angular lifecycle hooks are not part of what callers depend on, so they do not count.

## Options

```json
[
  {
    "type": "object",
    "properties": {
      "max": {
        "type": "integer",
        "minimum": 0,
        "description": "Maximum number of public methods per class."
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
    "max": 10
  }
]
```

## Examples

These examples are the rule's test cases, so they match its current behaviour.

<details>
<summary>❌ Incorrect code</summary>

#### Reports eleven public methods

```ts
class A {  m0() {}
 m1() {}
 m2() {}
 m3() {}
 m4() {}
 m5() {}
 m6() {}
 m7() {}
 m8() {}
 m9() {}
 m10() {} }
```

</details>

<details>
<summary>✅ Correct code</summary>

#### Accepts ten public methods

```ts
class A {  m0() {}
 m1() {}
 m2() {}
 m3() {}
 m4() {}
 m5() {}
 m6() {}
 m7() {}
 m8() {}
 m9() {} }
```

#### Does not count private, protected, accessors or Angular lifecycle hooks

```ts
class A {  m0() {}
 m1() {}
 m2() {}
 m3() {}
 m4() {}
 m5() {}
 m6() {}
 m7() {}
 m8() {}
 m9() {} private m0() {}
private m1() {}
private m2() {} protected p() {} get x() { return 1; } ngOnInit() {} ngOnDestroy() {} #hidden() {} }
```

</details>
