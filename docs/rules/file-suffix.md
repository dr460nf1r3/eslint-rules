<!--
  DO NOT EDIT. Generated from src/rules/file-suffix.ts and tests/rules/file-suffix/cases.ts.
  Run `pnpm update-rule-docs` to update it.
-->

# `@dr460nf1r3/file-suffix`

Require kebab-case file names with a suffix matching the declared role

- Type: suggestion
- Presets: `recommended`, `full`
- Targets: Angular, NestJS

## Rationale

File names follow the Angular and Nest style guides: kebab-case, with a role suffix (`.component.ts`, `.controller.ts`, `.service.ts`, `.routes.ts`, ...) that matches what the file declares. Role suffixes make files findable by type and keep one role per file, and kebab-case avoids surprises on case-insensitive file systems.

## Options

The rule has no options.

## Examples

These examples are the rule's test cases, so they match its current behaviour.

<details>
<summary>❌ Incorrect code</summary>

#### Reports a decorator in a file without its suffix

File: `src/app/sudo.content.ts`

```ts
@Component({}) export class SudoContent {}
```

#### Reports a decorator in a file without its suffix (2)

File: `src/app/container-bom-controller.ts`

```ts
@Controller('x') export class C {}
```

#### Reports a decorator in a file without its suffix (3)

File: `src/app/routes.ts`

```ts
export const routes: Routes = [];
```

#### Accepts suffix synonyms such as .route.ts for Routes only through .routes.ts

File: `src/app/bom.route.ts`

```ts
export const routes: Routes = [];
```

#### Reports a pipe class in a non-.pipe.ts file

File: `src/app/parse.ts`

```ts
export class ParseDocumentType implements PipeTransform {}
```

#### Reports non-kebab-case basenames

File: `libs/shared/src/lib/dashboard/APP_DASHBOARD.ts`

```ts
export {};
```

#### Reports non-kebab-case basenames (2)

File: `libs/shared/src/lib/lab/labGroup.ts`

```ts
export {};
```

</details>

<details>
<summary>✅ Correct code</summary>

#### Accepts matching suffixes

File: `src/app/invoice-out-list.component.ts`

```ts
@Component({}) export class InvoiceOutList {}
```

#### Accepts matching suffixes (2)

File: `src/app/work-list.controller.ts`

```ts
@Controller('x') export class WorkListController {}
```

#### Accepts matching suffixes (3)

File: `src/app/invoice.service.ts`

```ts
@Service() export class InvoiceService {}
```

#### Accepts matching suffixes (4)

File: `src/app/smart-docs.routes.ts`

```ts
export const routes: Routes = [];
```

#### Reports non-kebab-case basenames (3)

File: `src/app/index.ts`

```ts
export {};
```

</details>
