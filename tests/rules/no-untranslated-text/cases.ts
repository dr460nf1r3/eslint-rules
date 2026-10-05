import type { InvalidTestCase, ValidTestCase } from '@typescript-eslint/rule-tester';
import type { MessageIds, Options } from '../../../src/rules/no-untranslated-text.js';
import { templateLanguageOptions } from '../../test-utils.js';

const TEMPLATE = { languageOptions: templateLanguageOptions, filename: 'src/app/example.component.html' } as const;
const COMPONENT = 'src/app/list.component.ts';
/**
 * The `bareText` fix shows Angular interpolation, which RuleTester reads as an unfilled `{{placeholder}}`.
 * ESLint leaves unknown placeholders as they are, so mapping it to itself matches the real message.
 */
const TRANSLOCO_EXAMPLE = { "t('<scope>.<key>')": "{{ t('<scope>.<key>') }}" };

export const valid: readonly ValidTestCase<Options>[] = [
  {
    name: 'accepts text that goes through transloco',
    code: `<ng-container *transloco="let t"><span>{{ t('invoice.title') }}</span><button [label]="t('common.cancel')"></button></ng-container>`,
    ...TEMPLATE,
  },
  {
    name: 'ignores symbols, numbers and non-user-facing attributes',
    code: `<span>→ / : 100 %</span><div class="Header" id="Main" glyph="decline"></div>`,
    ...TEMPLATE,
  },
  {
    name: 'accepts translation keys and translated values',
    code: `const a = { label: 'smartDocs.list.docNum' }; const b = { title: t('x.y') }; const c = { header: translate('a.b') };`,
    filename: COMPONENT,
  },
];

export const invalid: readonly InvalidTestCase<MessageIds, Options>[] = [
  {
    name: 'reports bare text nodes',
    code: '<p>Bitte warten</p>',
    ...TEMPLATE,
    errors: [{ messageId: 'bareText', data: { ...TRANSLOCO_EXAMPLE, text: 'Bitte warten' } }],
  },
  {
    name: 'reports bare user-facing attributes',
    code: `<button fd-button label="Abbrechen"></button><input placeholder="Mandant" /><div title="Please wait"></div>`,
    ...TEMPLATE,
    errors: [
      { messageId: 'bareAttribute', data: { name: 'label', text: 'Abbrechen' } },
      { messageId: 'bareAttribute', data: { name: 'placeholder', text: 'Mandant' } },
      { messageId: 'bareAttribute', data: { name: 'title', text: 'Please wait' } },
    ],
  },
  {
    name: 'reports sentence-like literals on label-like properties',
    code: `const column = tableColumn({ uniqueId: 'docNum', label: 'Document number' });`,
    filename: COMPONENT,
    errors: [{ messageId: 'bareLabel', data: { name: 'label', text: 'Document number' } }],
  },
];
