<!--
  DO NOT EDIT. Generated from src/rules/max-comment-lines.ts and tests/rules/max-comment-lines/cases.ts.
  Run `pnpm update-rule-docs` to update it.
-->

# `@dr460nf1r3/max-comment-lines`

Limit comment length

- Type: suggestion
- Presets: `recommended`, `full`

## Rationale

Long comments are skipped by readers and drift from the code. A long explanation inside a function means the code is not saying enough itself, and doc comments are read in hover popups where a few lines is the most anyone reads. Comments inside function bodies, JSDoc descriptions (tags excluded) and everything else each get their own limit, and the background belongs in the docs or the commit message.

## Options

```json
[
  {
    "type": "object",
    "properties": {
      "body": {
        "type": "integer",
        "description": "Maximum lines of a comment inside a function body."
      },
      "docDescription": {
        "type": "integer",
        "description": "Maximum lines of a JSDoc description, tags excluded."
      },
      "other": {
        "type": "integer",
        "description": "Maximum lines of any other comment."
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
    "body": 3,
    "docDescription": 6,
    "other": 4
  }
]
```

## Examples

These examples are the rule's test cases, so they match its current behaviour.

<details>
<summary>❌ Incorrect code</summary>

#### Allows three lines inside a function body and reports four (2)

```ts
function f() {
  // line 0
  // line 1
  // line 2
  // line 3
  return 1;
}
```

#### Allows six JSDoc description lines, not counting tags (2)

```ts
/**
 * line 0
 * line 1
 * line 2
 * line 3
 * line 4
 * line 5
 * line 6
 */
function f() {}
```

#### Allows four lines for other comments and reports five (2)

```ts
// line 0
// line 1
// line 2
// line 3
// line 4
const a = 1;
```

#### Honours options

Options: `[{"body":1,"docDescription":1,"other":1}]`

```ts
// line 0
// line 1
const a = 1;
```

</details>

<details>
<summary>✅ Correct code</summary>

#### Allows three lines inside a function body and reports four

```ts
function f() {
  // line 0
  // line 1
  // line 2
  return 1;
}
```

#### Allows six JSDoc description lines, not counting tags

```ts
/**
 * line 0
 * line 1
 * line 2
 * line 3
 * line 4
 * line 5
 * @param a One.
 * @param b Two.
 * @returns Three.
 */
function f(a, b) {}
```

#### Allows four lines for other comments and reports five

```ts
// line 0
// line 1
// line 2
// line 3
const a = 1;
```

</details>
