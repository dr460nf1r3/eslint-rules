<!--
  DO NOT EDIT. Generated from src/rules/no-untranslated-text.ts and tests/rules/no-untranslated-text/cases.ts.
  Run `pnpm update-rule-docs` to update it.
-->

# `@dr460nf1r3/no-untranslated-text`

Require user-facing text to go through Transloco

- Type: problem
- Presets: `full`
- Targets: Angular, Transloco

## Rationale

Bare text is shown in one language only and cannot be changed without a release, so every user-facing string goes through Transloco: `{{ t('key') }}` in templates and `t(...)`, `translateSignal(...)` or `TranslocoService` in code. Templates are checked for bare text and bare user-facing attributes; TypeScript is checked for sentence-like literals on label-like properties, which translation keys never are because they contain no spaces.

## Options

The rule has no options.

## Examples

These examples are the rule's test cases, so they match its current behaviour.

<details>
<summary>❌ Incorrect code</summary>

#### Reports bare text nodes

File: `src/app/example.component.html`

```html
<p>Bitte warten</p>
```

#### Reports bare user-facing attributes

File: `src/app/example.component.html`

```html
<button fd-button label="Abbrechen"></button><input placeholder="Mandant" /><div title="Please wait"></div>
```

#### Reports sentence-like literals on label-like properties

File: `src/app/list.component.ts`

```ts
const column = tableColumn({ uniqueId: 'docNum', label: 'Document number' });
```

</details>

<details>
<summary>✅ Correct code</summary>

#### Accepts text that goes through transloco

File: `src/app/example.component.html`

```html
<ng-container *transloco="let t"><span>{{ t('invoice.title') }}</span><button [label]="t('common.cancel')"></button></ng-container>
```

#### Ignores symbols, numbers and non-user-facing attributes

File: `src/app/example.component.html`

```html
<span>→ / : 100 %</span><div class="Header" id="Main" glyph="decline"></div>
```

#### Accepts translation keys and translated values

File: `src/app/list.component.ts`

```ts
const a = { label: 'smartDocs.list.docNum' }; const b = { title: t('x.y') }; const c = { header: translate('a.b') };
```

</details>
