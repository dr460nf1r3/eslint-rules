<!--
  DO NOT EDIT. Generated from src/rules/no-restating-comment.ts and tests/rules/no-restating-comment/cases.ts.
  Run `pnpm update-rule-docs` to update it.
-->

# `@dr460nf1r3/no-restating-comment`

Disallow comments that restate the adjacent code

- Type: suggestion
- Presets: `recommended`, `full`

## Rationale

What-comments repeat the code, double the reading and go stale when the code changes. The rule compares a comment's words with the adjacent line, matching verbs as concepts so "Loop over all lines" matches `for (const line of lines)`. Comments that give a reason (because, otherwise, an SAP quirk) are kept.

## Options

The rule has no options.

## Examples

These examples are the rule's test cases, so they match its current behaviour.

<details>
<summary>❌ Incorrect code</summary>

#### Reports "// Set loading to true\nthis.loading.set(true);"

```ts
function f() {
// Set loading to true
this.loading.set(true);
}
```

#### Reports "// Get the user from the session\nconst user = session.user;"

```ts
function f() {
// Get the user from the session
const user = session.user;
}
```

#### Reports "// Loop over all lines\nfor (const line of lines) {}"

```ts
function f() {
// Loop over all lines
for (const line of lines) {}
}
```

#### Reports "// Check if the user is an admin\nif (user.isAdmin) {}"

```ts
function f() {
// Check if the user is an admin
if (user.isAdmin) {}
}
```

#### Reports "/* Return the total */\nreturn total;"

```ts
function f() {
/* Return the total */
return total;
}
```

#### Reports a trailing comment that restates its line

```ts
let count = 1;
count = 0; // reset count
```

</details>

<details>
<summary>✅ Correct code</summary>

#### Accepts comments that explain why or add information

```ts
function f() {
  // B1 recalculates the gross price after a PATCH
  const price = line.price;
  // Set to Y, otherwise SAP ignores the line
  this.flag.set('Y');
  // Dunning level 3 blocks deliveries in the customer's B1 setup
  if (partner.dunningLevel > 2) {}
}
```

#### Ignores JSDoc, directives and commented-out code

```ts
/** Gets the user. */
function getUser() {}
// eslint-disable-next-line
const user = 1;
// const user = load();
const a = 1;
```

</details>
