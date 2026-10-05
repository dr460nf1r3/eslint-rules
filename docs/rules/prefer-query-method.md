<!--
  DO NOT EDIT. Generated from src/rules/prefer-query-method.ts and tests/rules/prefer-query-method/cases.ts.
  Run `pnpm update-rule-docs` to update it.
-->

# `@dr460nf1r3/prefer-query-method`

Use the HTTP QUERY method with a body instead of ?query params

- Type: suggestion
- Presets: `full`
- Targets: Angular, NestJS

## Rationale

Query strings are untyped text: numbers and arrays need manual parsing, values end up in access logs, and URL length caps complex filters. The HTTP QUERY method is just as safe and idempotent as GET but carries a validated body, routed in Nest with `@QueryMethod()` and sent from Angular with `method: 'QUERY'`. Nest `@Get()` handlers reading `@Query()` and Angular `httpResource`/`HttpClient.get` requests with `params` or a `?key=` URL are reported.

## Options

The rule has no options.

## Examples

These examples are the rule's test cases, so they match its current behaviour.

<details>
<summary>❌ Incorrect code</summary>

#### Reports a @Get() handler that reads @Query() params, once per handler

```ts
import { Controller, Get, Query, Param } from '@nestjs/common'; class C { @Get('batches') list(@Query('itemCode') itemCode?: string, @Query('batch') batch?: string) {} }
```

#### Reports httpResource requests built with params or a ?key= url

```ts
import { HttpClient, httpResource } from '@angular/common/http'; class C {
        a = httpResource(() => ({ url: '/rows', params: { page: 1 } }));
        b = httpResource(() => `${this.api}/rows?id=${this.id()}`);
        c = httpResource.text(() => { return { url: `${this.api}/rows?id=${this.id()}` }; });
      }
```

#### Reports HttpClient.get with params or a ?key= url

```ts
import { HttpClient, httpResource } from '@angular/common/http'; class C { http = inject(HttpClient);
        a() { return this.http.get('/rows', { params: { page: 1 } }); }
        b(id) { return this.http.get(`/rows?id=${id}`); }
        c() { return this.http.get('/rows'); }
      }
```

</details>

<details>
<summary>✅ Correct code</summary>

#### Accepts @Get() handlers that only use path params

```ts
import { Controller, Get, Query, Param } from '@nestjs/common'; class C { @Get(':id') one(@Param('id') id: string) {} }
```

#### Ignores a @Query() decorator that does not come from Nest

```ts
import { Get } from '@nestjs/common'; import { Query } from './own'; class C { @Get() list(@Query() q) {} }
```

#### Accepts httpResource requests that already choose a method or carry no query string

```ts
import { HttpClient, httpResource } from '@angular/common/http'; class C {
        a = httpResource(() => ({ url: '/rows', method: 'QUERY', body: { page: 1 } }));
        b = httpResource(() => `${this.api}/rows/${this.id()}`);
      }
```

#### Ignores get() on things that are not HttpClient

```ts
class C { map = new Map(); x() { return this.map.get('/a?b=c'); } }
```

</details>
