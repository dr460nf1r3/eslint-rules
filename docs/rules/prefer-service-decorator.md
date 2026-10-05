<!--
  DO NOT EDIT. Generated from src/rules/prefer-service-decorator.ts and tests/rules/prefer-service-decorator/cases.ts.
  Run `pnpm update-rule-docs` to update it.
-->

# `@dr460nf1r3/prefer-service-decorator`

Use @Service() instead of @Injectable() for Angular root services

- Type: suggestion
- Presets: `recommended`, `full`
- 🔧 Fixable with `--fix`
- Targets: Angular

## Rationale

Angular 22's `@Service()` is the shorthand for `@Injectable({ providedIn: 'root' })`, and mixing both styles hides which services are root singletons. Bare and root-provided Angular `@Injectable`s are converted automatically; providers with other options and Nest's `@Injectable` are left alone.

## Options

The rule has no options.

## Examples

These examples are the rule's test cases, so they match its current behaviour.

<details>
<summary>❌ Incorrect code</summary>

#### Reports and fixes @Injectable({ providedIn: "root" })

```ts
import { inject, Injectable } from '@angular/core';
@Injectable({ providedIn: 'root' })
export class InvoiceService {}
```

#### Keeps the Injectable import when another class still uses it

```ts
import { Injectable } from '@angular/core';
@Injectable()
class A {}
@Injectable({ providedIn: 'platform' })
class B {}
```

</details>

<details>
<summary>✅ Correct code</summary>

#### Ignores Nest @Injectable

```ts
import { Injectable } from '@nestjs/common';
@Injectable()
class S {}
```

#### Ignores Angular providers that need other options

```ts
import { Injectable } from '@angular/core';
@Injectable({ providedIn: 'root', useFactory: () => new X() })
class S {}
```

</details>
