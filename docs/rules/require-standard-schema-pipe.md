<!--
  DO NOT EDIT. Generated from src/rules/require-standard-schema-pipe.ts and tests/rules/require-standard-schema-pipe/cases.ts.
  Run `pnpm update-rule-docs` to update it.
-->

# `@dr460nf1r3/require-standard-schema-pipe`

Require the global StandardSchemaValidationPipe in Nest bootstraps

- Type: problem
- Presets: `full`
- Targets: NestJS

## Rationale

A `@Body({ schema })` option does nothing unless the app registers `StandardSchemaValidationPipe` globally; without it, request validation is silently skipped. Every file that calls `NestFactory.create` must therefore also construct the pipe.

## Options

The rule has no options.

## Examples

These examples are the rule's test cases, so they match its current behaviour.

<details>
<summary>❌ Incorrect code</summary>

#### Reports a bootstrap without the pipe

File: `apps/api/src/main.ts`

```ts
const app = await NestFactory.create(AppModule); app.useGlobalPipes(new ValidationPipe());
```

</details>

<details>
<summary>✅ Correct code</summary>

#### Accepts a bootstrap that registers the pipe

File: `apps/api/src/main.ts`

```ts
const app = await NestFactory.create(AppModule); app.useGlobalPipes(new StandardSchemaValidationPipe());
```

#### Ignores files that do not bootstrap Nest

File: `apps/shell/src/main.ts`

```ts
bootstrapApplication(App);
```

</details>
