<!--
  DO NOT EDIT. Generated from src/rules/prefer-http-resource.ts and tests/rules/prefer-http-resource/cases.ts.
  Run `pnpm update-rule-docs` to update it.
-->

# `@dr460nf1r3/prefer-http-resource`

Use httpResource for GET requests instead of HttpClient.get

- Type: suggestion
- Presets: `recommended`, `full`
- Targets: Angular

## Rationale

A manual `HttpClient.get` plus subscribe leaks subscriptions and re-implements the loading and error state that `httpResource` provides as signals. Only `get` on a member known to be an `HttpClient` is reported; writes keep using `HttpClient`.

## Options

The rule has no options.

## Examples

These examples are the rule's test cases, so they match its current behaviour.

<details>
<summary>❌ Incorrect code</summary>

#### Reports a manual GET through an inject()ed HttpClient

```ts
import { HttpClient } from '@angular/common/http'; class C { private http = inject(HttpClient); load() { this.http.get<Row[]>('/rows').subscribe(); } }
```

#### Reports a manual GET through a constructor-injected HttpClient

```ts
import { HttpClient } from '@angular/common/http'; class C { constructor(private readonly httpClient: HttpClient) {} load() { return this.httpClient.get('/rows'); } }
```

</details>

<details>
<summary>✅ Correct code</summary>

#### Accepts mutations

```ts
import { HttpClient } from '@angular/common/http'; class C { private http = inject(HttpClient); save(row) { return firstValueFrom(this.http.post('/rows', row)); } }
```

#### Ignores get() on things that are not HttpClient

```ts
class C { form = inject(FormBuilder); x() { return this.form.get('name'); } }
```

</details>
