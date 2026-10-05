<!--
  DO NOT EDIT. Generated from src/rules/no-restating-jsdoc.ts and tests/rules/no-restating-jsdoc/cases.ts.
  Run `pnpm update-rule-docs` to update it.
-->

# `@dr460nf1r3/no-restating-jsdoc`

Disallow JSDoc that restates the documented name, parameters or return

- Type: suggestion
- Presets: `recommended`, `full`

## Rationale

A doc comment that restates the signature costs reading time and adds nothing a reader or IDE does not already show. The rule flags descriptions made only of the name's own words ("Gets the invoice lines." on `getInvoiceLines`), `@param user The user.` and `@returns The result.`, matching verbs as concepts so synonyms count. Descriptions that give a reason are kept.

## Options

The rule has no options.

## Examples

These examples are the rule's test cases, so they match its current behaviour.

<details>
<summary>❌ Incorrect code</summary>

#### Reports a description that only repeats the function name, also through synonyms

```ts
/** Gets the invoice lines. */
function getInvoiceLines() {}
```

#### Reports a description that only repeats the function name, also through synonyms (2)

```ts
/** Returns the invoice lines. */
export function getInvoiceLines() {}
```

#### Reports restating descriptions on decorated methods and properties

```ts
class A {
  /** Loads the user. */
  @Trace
  loadUser() {}
  /** The page size. */
  pageSize = 10;
}
```

#### Reports @param descriptions that repeat the parameter name

```ts
/**
 * Prices one line with the customer discount rules B1 applies.
 * @param user The user.
 * @param lineNum The line number.
 */
function price(user, lineNum) {}
```

#### Reports generic @returns descriptions

```ts
/**
 * Sums net prices as B1 does, per line before the header discount.
 * @returns The result.
 */
function total() {}
```

</details>

<details>
<summary>✅ Correct code</summary>

#### Accepts JSDoc that adds information

```ts
/**
 * Loads the draft and falls back to the base document when no draft exists.
 * @param user The logged-in user whose company DB is queried.
 * @returns The parsed value, with the schema defaults applied.
 */
function getDraft(user) {}
```

</details>
