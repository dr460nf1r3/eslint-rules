import type { TSESTree } from '@typescript-eslint/utils';
import { createRule } from '../utils/create-rule.js';
import { guidance } from '../utils/message.js';

export type Options = [];

export type MessageIds = 'bareText' | 'bareAttribute' | 'bareLabel';

export const RULE_NAME = 'no-untranslated-text';

const LETTER = /\p{L}/u;
const USER_FACING_ATTRIBUTES: ReadonlySet<string> = new Set([
  'label',
  'placeholder',
  'title',
  'header',
  'subtitle',
  'description',
  'text',
  'tooltip',
  'message',
  'headline',
  'alt',
  'aria-label',
  'aria-description',
  'arialabel',
  'fd-tooltip',
  'fdtooltip',
]);
const LABEL_PROPERTIES: ReadonlySet<string> = new Set([
  'label',
  'title',
  'header',
  'placeholder',
  'text',
  'tooltip',
  'description',
  'subtitle',
  'headline',
]);
const IGNORED_TAGS: ReadonlySet<string> = new Set(['code', 'pre', 'script', 'style']);

/** The parts of an Angular `ParseSourceSpan` this rule hands back to the template parser. */
type SourceSpan = object;

/** An Angular template `Text` node, as produced by `@angular-eslint/template-parser`. */
interface TemplateText {
  value: string;
  sourceSpan: SourceSpan;
  keySpan?: SourceSpan;
  parent?: { name?: string };
}

/** An Angular template `TextAttribute` node, as produced by `@angular-eslint/template-parser`. */
interface TemplateTextAttribute {
  name: string;
  value: string;
  sourceSpan: SourceSpan;
  keySpan?: SourceSpan;
}

interface TemplateParserServices {
  convertNodeSourceSpanToLoc(sourceSpan: SourceSpan): TSESTree.SourceLocation;
}

/**
 * Every user-facing string goes through Transloco: `{{ t('key') }}` in templates, `t(...)` /
 * `translateSignal(...)` / `TranslocoService` in code. Templates are checked for bare text and bare
 * user-facing attributes. TypeScript is checked for sentence-like literals on label-like properties
 * (translation keys never contain spaces, so those pass).
 */
export default createRule<Options, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: 'problem',
    docs: {
      description: 'Require user-facing text to go through Transloco',
      frameworks: ['Angular', 'Transloco'],
    },
    schema: [],
    messages: {
      bareText: guidance({
        problem: 'Untranslated text "{{text}}" in the template.',
        why: 'Bare text is shown in one language only and cannot be changed without a release.',
        fix: "Add a key to the scope's `assets/i18n/{de,en}.json` and render it with `{{ t('<scope>.<key>') }}` inside `*transloco=\"let t\"`.",
      }),
      bareAttribute: guidance({
        problem: 'Untranslated `{{name}}="{{text}}"` in the template.',
        why: 'Bare attribute text is shown in one language only and cannot be changed without a release.',
        fix: 'Bind it instead: `[{{name}}]="t(\'<scope>.<key>\')"`, with the key in `assets/i18n/{de,en}.json`.',
      }),
      bareLabel: guidance({
        problem: 'Untranslated `{{name}}: "{{text}}"`.',
        why: 'Literal labels in code are shown in one language only.',
        fix: "Use a translation key (`{{name}}: '<scope>.<key>'` where the consumer translates it) or `translateSignal('<scope>.<key>')` / `TranslocoService.translate` for one-off strings.",
      }),
    },
  },
  defaultOptions: [],

  create(context) {
    const services = context.sourceCode.parserServices as Partial<TemplateParserServices> | undefined;
    const locOf = (node: TemplateText | TemplateTextAttribute): TSESTree.SourceLocation | undefined =>
      services?.convertNodeSourceSpanToLoc?.(node.keySpan ?? node.sourceSpan);

    return {
      Text(node: TSESTree.Node) {
        const template = node as unknown as TemplateText;
        const text = template.value.trim();
        const loc = locOf(template);
        if (!loc || !LETTER.test(text) || IGNORED_TAGS.has(template.parent?.name ?? '')) return;

        context.report({ loc, messageId: 'bareText', data: { text: abbreviate(text) } });
      },
      TextAttribute(node: TSESTree.Node) {
        const attribute = node as unknown as TemplateTextAttribute;
        const loc = locOf(attribute);
        if (!loc || !USER_FACING_ATTRIBUTES.has(attribute.name.toLowerCase()) || !LETTER.test(attribute.value)) return;

        context.report({
          loc,
          messageId: 'bareAttribute',
          data: { name: attribute.name, text: abbreviate(attribute.value) },
        });
      },
      Property(node) {
        const name = propertyKeyName(node.key);
        const value = node.value;
        if (!LABEL_PROPERTIES.has(name ?? '') || value.type !== 'Literal' || typeof value.value !== 'string') return;
        if (!/\s/.test(value.value.trim()) || !LETTER.test(value.value)) return;

        context.report({ node: value, messageId: 'bareLabel', data: { name, text: abbreviate(value.value) } });
      },
    };
  },
});

function propertyKeyName(key: TSESTree.Node): string | undefined {
  if (key.type === 'Identifier' || key.type === 'PrivateIdentifier') return key.name;
  if (key.type === 'Literal' && typeof key.value === 'string') return key.value;

  return undefined;
}

function abbreviate(text: string): string {
  const singleLine = text.replace(/\s+/g, ' ');
  return singleLine.length > 40 ? `${singleLine.slice(0, 37)}...` : singleLine;
}

export const RULE_DOCS_EXTENSION = {
  rationale:
    "Bare text is shown in one language only and cannot be changed without a release, so every user-facing string goes through Transloco: `{{ t('key') }}` in templates and `t(...)`, `translateSignal(...)` or `TranslocoService` in code. Templates are checked for bare text and bare user-facing attributes; TypeScript is checked for sentence-like literals on label-like properties, which translation keys never are because they contain no spaces.",
};
