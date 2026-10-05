<!--
  DO NOT EDIT. Generated from src/rules/statement-spacing.ts and tests/rules/statement-spacing/cases.ts.
  Run `pnpm update-rule-docs` to update it.
-->

# `@dr460nf1r3/statement-spacing`

Deterministic blank lines between statements and class members

- Type: layout
- Presets: `lite`, `recommended`, `full`
- 🔧 Fixable with `--fix`

## Rationale

A fixed rhythm of blank lines makes the steps of a function visible at a glance and keeps diffs free of spacing churn. The blank line between two statements is decided from their shapes alone (imports, exports, guards, declarations and the statements that read them, blocks, multi-line statements, final returns), and class members are grouped the same way, so layout never depends on taste. Pairs no rule covers keep whatever the author wrote; `one-line-guard` decides whether a guard is one line in the first place.

## Options

The rule has no options.

## Examples

These examples are the rule's test cases, so they match its current behaviour.

<details>
<summary>❌ Incorrect code</summary>

#### Inserts a blank line after the last guard

```ts
function f() {
  if (!user) return;
  load(user);
}
```

#### Removes a blank line between guards

```ts
function f() {
  if (!a) return;

  if (!b) return;
}
```

#### Separates a guard group from an unrelated statement above it

```ts
function f() {
  start();
  if (!a) return;
}
```

#### Removes a blank line between a declaration and the if that reads it

```ts
function f() {
  const a = get();

  if (!a) return;
}
```

#### Requires a blank line when the if does not read the declaration

```ts
function f() {
  const a = get();
  if (!b) return;
}
```

#### Keeps a declaration next to any statement that reads it

```ts
function f() {
  const existing = list[0];

  logger.debug(existing.code);

  return existing;
}
```

#### Still separates a declaration from a statement that does not read it

```ts
function f() {
  const a = 1;
  logger.debug(b);
}
```

#### Only looks at the header, not at the body of the block

```ts
function f() {
  const a = get();
  if (ready) {
    use(a);
  }
}
```

#### Surrounds a multi-line if with blank lines

```ts
function f() {
  start();
  if (a) {
    b();
  }
  end();
}
```

#### Treats try and switch as blocks

```ts
function f() {
  start();
  try {
    a();
  } catch {}
  end();
}
```

#### Keeps declarations together and separates the group

```ts
function f() {
  const user = request.user;

  const limit = 50;
  load();
}
```

#### Keeps a two-statement block compact

```ts
function f() {
  const gross = price * quantity;

  return gross - discount;
}
```

#### Separates the return of a longer block

```ts
function f() {
  const net = sumNet(lines);
  const tax = sumTax(lines);
  return net + tax;
}
```

#### Surrounds a statement spanning several lines with blank lines

```ts
function f() {
  start();
  await get(company, {
    top: 50,
  });
  end();
}
```

#### Keeps multi-line declarations in their declaration group

```ts
function f() {
  const fields = [
    { model: header },
  ];

  const grids = [];
  load();
}
```

#### Fixes gaps between fields and missing gaps between methods

```ts
class A {
  a = 1;

  b = 2;
  m() {
    return 1;
  }
}
```

#### Separates injected dependencies from other members and keeps them together

```ts
class A {
  private readonly http = inject(HttpClient);

  private readonly router = inject(Router);
  readonly loading = signal(false);
}
```

#### Treats a decorated field on two lines as multi-line

```ts
class A {
  a = 1;
  @Input()
  b = 2;
}
```

#### Moves a leading comment together with its statement

```ts
function f() {
  if (!a) return;
  // load the rest
  load();
}
```

#### Keeps a trailing comment on the previous line

```ts
function f() {
  if (!a) return; // nothing to do
  load();
}
```

#### Never separates imports and re-exports, even multi-line ones

```ts
import { a } from 'a';

import {
  b,
  c,
} from 'b';
export {
  d,
} from 'd';
const x = 1;
```

#### Separates every exported declaration, even one-line ones

```ts
export const a = [
  1,
];
export const b = 2;
export const c = 3;
const d = 4;
```

#### Leaves blank lines to statement-spacing after reordering (class-member-order)

```ts
class A {
  private readonly http = inject(HttpClient);
  save() {
    return 1;
  }
}
```

</details>

<details>
<summary>✅ Correct code</summary>

#### Keeps consecutive guards together and separates the group from what follows

```ts
function f() {
  if (!user) return;
  if (!company) return;

  load(user);
  done();
}
```

#### Keeps a declaration next to the guard or loop that reads it

```ts
function f() {
  const match = rows.find(isOpen);
  if (!match) return;

  const lines = load();
  for (const line of lines) {
    use(line);
  }
}
```

#### Keeps a declaration next to a multi-line call that reads it

```ts
function f() {
  const user = request.user;
  await load(
    user,
  );
}
```

#### Wins over the multi-line rule

```ts
function f() {
  const match = rows.find(
    (row) => row.open,
  );
  if (!match) return;
}
```

#### Accepts a block as first and last statement

```ts
function f() {
  for (const x of xs) {
    use(x);
  }
}
```

#### Leaves the gap before a declaration group to the author

```ts
function f() {
  start();
  const a = 1;

  use(b);
}
```

#### Leaves consecutive one-line expression statements to the author

```ts
function f() {
  a();
  b();

  c();
}
```

#### Groups one-line fields and separates methods

```ts
class A {
  a = 1;
  b = 2;

  m() {
    return 1;
  }

  n() {
    return 2;
  }
}
```

</details>
