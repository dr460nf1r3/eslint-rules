<!--
  DO NOT EDIT. Generated from src/rules/prefer-mutation.ts and tests/rules/prefer-mutation/cases.ts.
  Run `pnpm update-rule-docs` to update it.
-->

# `@dr460nf1r3/prefer-mutation`

Use httpMutation/rxMutation from @part/partui5 instead of subscribing to one-off actions

- Type: suggestion
- Presets: `full`
- Targets: Angular

## Rationale

A `.subscribe()` inside an event-style method usually fires a one-off action: the subscription is never cleaned up, overlapping calls race, and pending/error state is re-implemented with ad-hoc flags. `httpMutation`/`rxMutation` from `@part/partui5` model these actions with signals. Long-lived subscriptions in the constructor, init hooks or field initializers stay allowed, and `HttpClient` GETs are left to `prefer-http-resource`.

## Options

The rule has no options.

## Examples

These examples are the rule's test cases, so they match its current behaviour.

<details>
<summary>❌ Incorrect code</summary>

#### Suggests httpMutation for an HttpClient POST subscribed in a handler

```ts
import { inject } from '@angular/core'; import { HttpClient } from '@angular/common/http'; class C { private http = inject(HttpClient); save(row) { this.http.post('/rows', row).subscribe(); } }
```

#### Follows pipe() chains back to a constructor-injected HttpClient

```ts
import { inject } from '@angular/core'; import { HttpClient } from '@angular/common/http'; class C { constructor(private api: HttpClient) {} remove(id) { this.api.delete('/rows/' + id).pipe(tap(() => {})).pipe(map(Boolean)).subscribe(); } }
```

#### Suggests rxMutation for any other observable subscribed in a handler, including arrow-function members

```ts
import { inject } from '@angular/core'; class C { save = (row) => { this.service.save(row).subscribe(); }; onClick() { this.service.run().subscribe(() => {}); } }
```

</details>

<details>
<summary>✅ Correct code</summary>

#### Accepts long-lived subscriptions set up in the constructor, init hooks or field initializers

```ts
import { inject } from '@angular/core'; class C {
      sub = this.route.params.subscribe();
      constructor() { toObservable(this.x).pipe(takeUntilDestroyed()).subscribe(); }
      ngOnInit() { this.form.valueChanges.subscribe(); }
    }
```

#### Accepts event streams that are properties rather than calls

```ts
import { inject } from '@angular/core'; class C { open() { dialogRef.afterClosed.pipe(take(1)).subscribe(); this.form.valueChanges.subscribe(); } }
```

#### Leaves HttpClient GETs to prefer-http-resource

```ts
import { inject } from '@angular/core'; import { HttpClient } from '@angular/common/http'; class C { private http = inject(HttpClient); load() { this.http.get('/rows').subscribe(); } }
```

#### Ignores subscribe outside classes

```ts
import { inject } from '@angular/core'; function f(source) { source.subscribe(); }
```

#### Ignores files that are not Angular code

```ts
class Worker { run() { this.queue.next().subscribe(); } }
```

</details>
