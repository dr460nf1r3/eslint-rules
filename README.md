# @dr460nf1r3/eslint-rules

Opinionated ESLint rules for TypeScript, Angular and NestJS code. Every message says what is wrong, why it matters
and how to fix it, so both people and coding agents can act on lint output without looking anything up.

## Installation

```sh
pnpm add -D @dr460nf1r3/eslint-rules eslint typescript typescript-eslint
# Optional, for Angular projects (template checks and the `angular` config):
pnpm add -D @angular-eslint/template-parser @angular-eslint/eslint-plugin @angular-eslint/eslint-plugin-template
```

Requires Node.js 26 or newer and ESLint 9 or 10 with flat config.

## Usage

```ts
// eslint.config.ts
import dr460nf1r3 from '@dr460nf1r3/eslint-rules';
import { defineConfig } from 'eslint/config';

export default defineConfig(dr460nf1r3.configs.recommended);
```

### Presets

Each preset contains every rule of the presets above it. All rules are reported as warnings; run ESLint with
`--max-warnings 0` to fail on them.

| Preset         | Contents                                                                                                                                                                                                                                                               |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lite`         | Low-friction rules: comment hygiene and layout rules, almost all autofixable, plus autofixable core shapes (`arrow-body-style`, `object-shorthand`, `prefer-template`, `no-else-return`, `@typescript-eslint/array-type`) and `@stylistic` formatting (see below).     |
| `recommended`  | `lite` plus size and structure limits (core `max-lines` 300, `max-lines-per-function` 40, `max-statements` 15, `max-depth` 3, `max-classes-per-file` 1, `no-nested-ternary`), parameter and dependency limits, comment quality and general Angular/NestJS conventions. |
| `full`         | Every rule, including the ones tied to a specific stack (Transloco, Standard Schema request validation, HTTP `QUERY`, mutation helpers).                                                                                                                               |
| `type-checked` | Add-on with `@typescript-eslint/prefer-optional-chain` and `return-await` (`in-try-catch`). Needs `parserOptions.projectService`.                                                                                                                                      |

The presets lint `**/*.{ts,tsx,mts,cts}` and register the `typescript-eslint` parser.

**Test files** (`**/*.spec.ts`, `**/*.test.ts`, `**/*.e2e-spec.ts`, `**/test/**`, `**/tests/**`, `**/__tests__/**`, e2e
folders) only get the layout rules and the core shapes. Globs resolve relative to the config file, so when a project
(an e2e app, say) has its own ESLint config, apply the relaxations to all of its files:

```ts
import dr460nf1r3, { testFiles, testRules } from '@dr460nf1r3/eslint-rules';

export default defineConfig(dr460nf1r3.configs.full, { files: ['**/*.ts'], rules: testRules });
// or: { ...dr460nf1r3.configs.tests[0], files: ['**/*.ts'] }
```

`testFiles` holds the test globs, for example to keep a stricter override off test files:
`{ files: ['**/*.ts'], ignores: testFiles, rules: { '@dr460nf1r3/max-params': ['warn', { max: 2 }] } }`.

**Angular templates** are linted (by `full`'s `no-untranslated-text` and by the `angular` config) when `@angular-eslint/template-parser` is installed: `**/*.component.html` and every
`.html` under `src/app/` or `src/lib/`, except `index.html`, `assets/`, `public/` and fixture folders.

### Angular

`angular` and `angular-type-checked` add angular-eslint rules. They are not part of the presets, because a glob cannot
tell Angular code from NestJS code (both use `@Injectable()`), so scope them to your Angular project. They need
`@angular-eslint/eslint-plugin`, `@angular-eslint/eslint-plugin-template` and `@angular-eslint/template-parser`.

```ts
export default defineConfig(dr460nf1r3.configs.full, {
  files: ['apps/web/**'],
  extends: [dr460nf1r3.configs.angular, dr460nf1r3.configs['angular-type-checked']],
});
```

- `angular`, TypeScript: `contextual-decorator`, `inject-at-top`, `no-async-lifecycle-method`,
  `no-implicit-take-until-destroyed`, `prefer-host-metadata-property`, `prefer-output-emitter-ref`,
  `prefer-output-readonly`, `prefer-service-decorator`, `relative-url-prefix`, `use-injectable-provided-in`,
  `use-pipe-transform-interface`
- `angular`, templates: `prefer-at-empty`, `prefer-built-in-pipes`, `prefer-class-binding`, `prefer-control-flow`,
  `prefer-self-closing-tags`, `prefer-template-literal`, `require-switch-default`, `use-track-by-function`
- `angular-type-checked` (needs `parserOptions.projectService`): `no-uncalled-signals`, `prefer-signal-model`,
  `prefer-signals`, `reactive-context-must-read-signal`

```ts
export default defineConfig(dr460nf1r3.configs.full, dr460nf1r3.configs['type-checked'], {
  languageOptions: { parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname } },
});
```

### Formatting

Every preset includes `@stylistic/eslint-plugin`'s recommended rules, customised to agree with Prettier: 2-space
indent, single quotes, semicolons, trailing commas, `1tbs` braces, arrow parentheses and consistent quoting of keys. Rules
Prettier owns (`indent`, `indent-binary-ops`, `operator-linebreak`, `lines-between-class-members`) are off, and
`padding-line-between-statements` adds a blank line after every block, `if`, `for`, `while` and `do` statement
(consecutive `if` guards may stay together). The plugin's [`blank-lines`](./docs/rules/blank-lines.md) rule handles
the rest: a blank line before `return` in blocks of three or more statements and none in shorter ones, and no blank
line between a declaration and the statement that reads it (except in test files, where setup and assertions may
stay apart). Use Prettier with
`singleQuote: true`, `trailingComma: 'all'`, `arrowParens: 'always'` and `quoteProps: 'consistent'` so both agree.

### Single rules

Rule thresholds are options with the preset values as defaults, so override them per rule:

```ts
export default defineConfig(dr460nf1r3.configs.recommended, {
  rules: { '@dr460nf1r3/max-params': ['warn', { max: 4 }] },
});
```

Without a preset, register the plugin yourself: `plugins: { '@dr460nf1r3': dr460nf1r3 }`.

## Rules

🔧 fixable with `--fix`, 💡 has suggestions. Targets name the framework or library a rule is about; rules without a
target apply to any TypeScript code.

<!-- begin rule list -->

| Rule                                                                           | Description                                                                                       | `lite` | `recommended` | `full` | Fix | Targets            |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- | :----: | :-----------: | :----: | :-: | ------------------ |
| [`blank-lines`](./docs/rules/blank-lines.md)                                   | Blank lines before returns by block size, none between a declaration and the statement reading it |   ✅   |      ✅       |   ✅   | 🔧  |                    |
| [`class-member-order`](./docs/rules/class-member-order.md)                     | One fixed order for class members                                                                 |   ✅   |      ✅       |   ✅   | 🔧  | Angular, NestJS    |
| [`comment-style`](./docs/rules/comment-style.md)                               | Use // for single-line and /** */ for multi-line comments                                         |   ✅   |      ✅       |   ✅   | 🔧  |                    |
| [`decorator-order`](./docs/rules/decorator-order.md)                           | One fixed order for method decorators and component metadata                                      |   ✅   |      ✅       |   ✅   | 🔧  | Angular, NestJS    |
| [`file-suffix`](./docs/rules/file-suffix.md)                                   | Require kebab-case file names with a suffix matching the declared role                            |        |      ✅       |   ✅   |     | Angular, NestJS    |
| [`max-comment-lines`](./docs/rules/max-comment-lines.md)                       | Limit comment length                                                                              |        |      ✅       |   ✅   |     |                    |
| [`max-dependencies`](./docs/rules/max-dependencies.md)                         | Limit injected dependencies per class (single responsibility)                                     |        |      ✅       |   ✅   |     | Angular, NestJS    |
| [`max-params`](./docs/rules/max-params.md)                                     | Limit undecorated function parameters; group them into a parameter object                         |        |      ✅       |   ✅   |     |                    |
| [`max-public-methods`](./docs/rules/max-public-methods.md)                     | Limit public methods per class (interface segregation)                                            |        |      ✅       |   ✅   |     |                    |
| [`no-comment-semicolon`](./docs/rules/no-comment-semicolon.md)                 | Disallow semicolons in comment prose                                                              |        |      ✅       |   ✅   |     |                    |
| [`no-commented-out-code`](./docs/rules/no-commented-out-code.md)               | Disallow commented-out code                                                                       |   ✅   |      ✅       |   ✅   |     |                    |
| [`no-filler-comments`](./docs/rules/no-filler-comments.md)                     | Disallow filler phrasing and section-divider comments                                             |        |      ✅       |   ✅   |     |                    |
| [`no-llm-artifacts`](./docs/rules/no-llm-artifacts.md)                         | Disallow placeholder comments and not-implemented stubs                                           |   ✅   |      ✅       |   ✅   |     |                    |
| [`no-new-service`](./docs/rules/no-new-service.md)                             | Inject collaborators instead of constructing them (dependency inversion)                          |        |      ✅       |   ✅   |     | Angular, NestJS    |
| [`no-restating-comment`](./docs/rules/no-restating-comment.md)                 | Disallow comments that restate the adjacent code                                                  |        |      ✅       |   ✅   |     |                    |
| [`no-restating-jsdoc`](./docs/rules/no-restating-jsdoc.md)                     | Disallow JSDoc that restates the documented name, parameters or return                            |        |      ✅       |   ✅   |     |                    |
| [`no-stray-semicolon`](./docs/rules/no-stray-semicolon.md)                     | Disallow empty statements and stray semicolons                                                    |   ✅   |      ✅       |   ✅   | 🔧  |                    |
| [`no-untranslated-text`](./docs/rules/no-untranslated-text.md)                 | Require user-facing text to go through Transloco                                                  |        |               |   ✅   |     | Angular, Transloco |
| [`one-line-guard`](./docs/rules/one-line-guard.md)                             | One-line guards for short jumps, braces for everything else                                       |   ✅   |      ✅       |   ✅   | 🔧  |                    |
| [`prefer-http-resource`](./docs/rules/prefer-http-resource.md)                 | Use httpResource for GET requests instead of HttpClient.get                                       |        |      ✅       |   ✅   |     | Angular            |
| [`prefer-mutation`](./docs/rules/prefer-mutation.md)                           | Use httpMutation/rxMutation from @part/partui5 instead of subscribing to one-off actions          |        |               |   ✅   |     | Angular            |
| [`prefer-query-method`](./docs/rules/prefer-query-method.md)                   | Use the HTTP QUERY method with a body instead of ?query params                                    |        |               |   ✅   |     | Angular, NestJS    |
| [`prefer-service-decorator`](./docs/rules/prefer-service-decorator.md)         | Use @Service() instead of @Injectable() for Angular root services                                 |        |      ✅       |   ✅   | 🔧  | Angular            |
| [`require-body-schema`](./docs/rules/require-body-schema.md)                   | Require `{ schema }` on @Body (and non-primitive @Param/@Query) parameters                        |        |               |   ✅   |     | NestJS             |
| [`require-standard-schema-pipe`](./docs/rules/require-standard-schema-pipe.md) | Require the global StandardSchemaValidationPipe in Nest bootstraps                                |        |               |   ✅   |     | NestJS             |

<!-- end rule list -->

## Development

| Command                         | Does                                                                                                                          |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test`                     | Rule tests (`tests/rules/<rule>/cases.ts`, run through `@typescript-eslint/rule-tester` in Vitest) and plugin checks          |
| `pnpm lint`                     | Lints the repository with its own `full` and `type-checked` presets, straight from `src`                                      |
| `pnpm typecheck` / `pnpm build` | Type checks everything / compiles `src` to `dist`                                                                             |
| `pnpm update-generated`         | Regenerates the preset files (`src/configs/{lite,recommended,full}.ts`), the rule docs (`docs/rules`) and the rule list above |
| `pnpm check-generated`          | Fails when a generated file is outdated (run in CI)                                                                           |

To add a rule:

1. Create `src/rules/<name>.ts` with `createRule` (see `max-params.ts`): `RULE_NAME`, `meta.docs.description`,
   `meta.docs.preset` (`lite` or `recommended`, omit for `full` only), messages built with `guidance()`, and
   `RULE_DOCS_EXTENSION.rationale`.
2. Add `tests/rules/<name>/cases.ts` (`valid`, `invalid`, every case with a `name`) and `spec.ts`.
3. Register it in `src/rules/index.ts` and run `pnpm update-generated`.

Messages follow "what / Why / How to fix" (`src/utils/message.ts`).

## License

[MIT](./LICENSE)
