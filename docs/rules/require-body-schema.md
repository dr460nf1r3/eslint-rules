<!--
  DO NOT EDIT. Generated from src/rules/require-body-schema.ts and tests/rules/require-body-schema/cases.ts.
  Run `pnpm update-rule-docs` to update it.
-->

# `@dr460nf1r3/require-body-schema`

Require `{ schema }` on @Body (and non-primitive @Param/@Query) parameters

- Type: problem
- Presets: `full`
- Targets: NestJS

## Rationale

TypeScript types vanish at runtime, so only a schema rejects malformed or malicious request input before it reaches the Service Layer or SQL. Nest validates the `{ schema }` option of `@Body`, `@Param` and `@Query` natively through the global `StandardSchemaValidationPipe`, which makes per-parameter zod pipes redundant. Primitive `@Param`/`@Query` values are skipped because Nest’s parse pipes already cover them.

## Options

```json
[
  {
    "type": "object",
    "properties": {
      "checkParams": {
        "type": "boolean",
        "description": "Also check `@Param` and `@Query` parameters whose type is not a primitive."
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
    "checkParams": true
  }
]
```

## Examples

These examples are the rule's test cases, so they match its current behaviour.

<details>
<summary>❌ Incorrect code</summary>

#### Reports a bare @Body() typed with an interface

```ts
import { Body, Param, Query } from '@nestjs/common';
class InvoiceController { update(@Body() body: InvoiceHeader) {} }
```

#### Reports a zod pipe instead of the schema option

```ts
import { Body, Param, Query } from '@nestjs/common';
class InvoiceController { update(@Body(new ZodValidationPipe(createDashboardSchema, errors)) body: CreateDashboardRequest) {} }
```

#### Reports a @Query bound to a DTO type and accepts it with a schema (2)

```ts
import { Body, Param, Query } from '@nestjs/common';
class InvoiceController { update(@Query() query: SearchDto) {} }
```

</details>

<details>
<summary>✅ Correct code</summary>

#### Accepts the shape @Body({ schema })

```ts
import { Body, Param, Query } from '@nestjs/common';
class InvoiceController { update(@Body({ schema: invoiceSchema }) body: Invoice) {} }
```

#### Accepts a property plus schema option

```ts
import { Body, Param, Query } from '@nestjs/common';
class InvoiceController { update(@Body('lines', { schema: linesSchema }) lines: Line[]) {} }
```

#### Accepts primitive @Param and @Query values, also with ParseIntPipe

```ts
import { Body, Param, Query } from '@nestjs/common';
class InvoiceController { update(@Param('code') code: string, @Query('page', ParseIntPipe) page: number, @Query('all') all: boolean, @Param('x') x) {} }
```

#### Reports a @Query bound to a DTO type and accepts it with a schema

```ts
import { Body, Param, Query } from '@nestjs/common';
class InvoiceController { update(@Query({ schema: searchSchema }) query: Search) {} }
```

#### Skips @Param and @Query when checkParams is off

Options: `[{"checkParams":false}]`

```ts
import { Body, Param, Query } from '@nestjs/common';
class InvoiceController { update(@Query() query: SearchDto) {} }
```

#### Ignores a Body decorator that is not Nest

```ts
import { Body } from './x'; class C { m(@Body() b: X) {} }
```

</details>
