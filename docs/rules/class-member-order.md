<!--
  DO NOT EDIT. Generated from src/rules/class-member-order.ts and tests/rules/class-member-order/cases.ts.
  Run `pnpm update-rule-docs` to update it.
-->

# `@dr460nf1r3/class-member-order`

One fixed order for class members

- Type: layout
- Presets: `lite`, `recommended`, `full`
- 🔧 Fixable with `--fix`
- Targets: Angular, NestJS

## Rationale

With one order, every class reads the same way: dependencies, then inputs, state, setup and finally behaviour. Statics come first, then `inject()` fields by visibility, inputs and outputs, queries, signals, derived signals, other fields, the constructor, lifecycle hooks in framework order and methods by visibility. Members of the same rank keep their source order, so Nest routes keep their registration order and overloads stay together, and the autofix is skipped when a field initialiser would read a field moved below it.

## Options

The rule has no options.

## Examples

These examples are the rule's test cases, so they match its current behaviour.

<details>
<summary>❌ Incorrect code</summary>

#### Orders inject() fields by visibility, readonly first

```ts
class A {
  readonly config = inject(Config);
  private store = inject(Store);
  private readonly http = inject(HttpClient);
}
```

#### Puts lifecycle hooks in framework order after the constructor

```ts
class A {
  ngOnDestroy() {}
  constructor() {}
  ngOnInit() {}
}
```

#### Classifies decorated inputs and queries

```ts
class A {
  @ViewChild("x") x;
  @Input() code: string;
}
```

#### Moves leading and trailing comments with their member

```ts
class A {
  save() {} // persists
  /** The client. */
  private readonly http = inject(HttpClient);
}
```

#### Does not fix when a field initialiser would read a field moved below it

```ts
class A {
  mode = 1;
  model = new Model(this.mode);
  readonly loading = signal(this.model.busy);
}
```

#### Fixes when the read is lazy, inside a function

```ts
class A {
  mode = 1;
  readonly loading = computed(() => this.mode === 1);
}
```

#### Leaves blank lines to statement-spacing after reordering

```ts
class A {
  save() {
    return 1;
  }
  private readonly http = inject(HttpClient);
}
```

</details>

<details>
<summary>✅ Correct code</summary>

#### Accepts the full Angular order

```ts
class A {
  static readonly KEY = "a";
  private readonly http = inject(HttpClient);
  protected readonly router = inject(Router);
  readonly code = input.required<string>();
  readonly saved = output<void>();
  readonly page = viewChild.required(PageComponent);
  readonly loading = signal(false);
  readonly title = computed(() => this.code());
  pageModel = new PageModel();
  constructor() {}
  ngOnInit() {}
  ngOnDestroy() {}
  save() {}
  protected cancel() {}
  private reset() {}
}
```

#### Keeps the source order of same-rank members, so Nest routes and overloads stay put

```ts
class A {
  constructor(private readonly s: S) {}
  @Get("list") list() {}
  @Get(":id") one() {}
  parse(a: string): void;
  parse(a: number): void;
  parse(a) {}
}
```

</details>
