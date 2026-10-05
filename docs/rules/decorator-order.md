<!--
  DO NOT EDIT. Generated from src/rules/decorator-order.ts and tests/rules/decorator-order/cases.ts.
  Run `pnpm update-rule-docs` to update it.
-->

# `@dr460nf1r3/decorator-order`

One fixed order for method decorators and component metadata

- Type: layout
- Presets: `lite`, `recommended`, `full`
- 🔧 Fixable with `--fix`
- Targets: Angular, NestJS

## Rationale

A fixed decorator stack reads route first and tracing last: route, guards and other behaviour, `@ApiOperation`, other Swagger decorators, responses, then `@Trace`, which must sit closest to the method to wrap it. `@Component` and `@Directive` metadata keys follow one order too, so every component header answers "what, which deps, how it looks, what it provides" in the same place.

## Options

The rule has no options.

## Examples

These examples are the rule's test cases, so they match its current behaviour.

<details>
<summary>❌ Incorrect code</summary>

#### Moves @Trace to the bottom and the route to the top

```ts
class C {
  @Trace
  @ApiResponse({})
  @ApiOperation({})
  @Post("save")
  list() {}
}
```

#### Reports without fixing when comments sit between decorators

```ts
class C {
  @Trace
  // why
  @Get()
  list() {}
}
```

#### Orders component metadata keys

```ts
@Component({
  templateUrl: './a.html',
  providers: [],
  selector: 'app-a',
  imports: [],
})
class A {}
```

</details>

<details>
<summary>✅ Correct code</summary>

#### Accepts route, behaviour, operation, parameters, responses, trace

```ts
class C {
  @Get("list")
  @UseGuards(AuthGuard)
  @HttpCode(200)
  @ApiOperation({})
  @ApiQuery({})
  @ApiResponse({})
  @ApiOkResponse({})
  @Trace
  list() {}
}
```

#### Keeps the order of repeated decorators

```ts
class C {
  @Get()
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404 })
  @Trace
  list() {}
}
```

#### Leaves metadata with spreads alone

```ts
@Component({ ...base, selector: 'a' })
class A {}
```

</details>
