import type { TSESLint, TSESTree } from '@typescript-eslint/utils';
import { decoratorName } from '../utils/ast.js';
import { createRule } from '../utils/create-rule.js';
import { guidance } from '../utils/message.js';

export type Options = [];

export type MessageIds = 'decoratorOrder' | 'metadataOrder';

export const RULE_NAME = 'decorator-order';

type Context = Readonly<TSESLint.RuleContext<MessageIds, Options>>;

interface OrderCheck<T extends TSESTree.Node> {
  items: readonly T[];
  rank: (item: T) => number;
  name: (item: T) => string | undefined;
  messageId: MessageIds;
}

const ROUTE_DECORATORS: ReadonlySet<string> = new Set([
  'Get',
  'Post',
  'Put',
  'Patch',
  'Delete',
  'Options',
  'Head',
  'All',
  'Search',
  'QueryMethod',
  'Sse',
  'SubscribeMessage',
  'MessagePattern',
  'EventPattern',
]);
const BEHAVIOUR_RANK = 1;
const SWAGGER_OTHER_RANK = 3;
const RESPONSE_RANK = 4;
const FIXED_RANKS: ReadonlyMap<string, number> = new Map([
  ['UseGuards', BEHAVIOUR_RANK],
  ['ApiOperation', 2],
  ['ApiResponse', RESPONSE_RANK],
  ['Trace', 5],
]);
const METADATA_KEYS = [
  'selector',
  'standalone',
  'imports',
  'template',
  'templateUrl',
  'styles',
  'styleUrl',
  'styleUrls',
  'providers',
  'viewProviders',
  'host',
  'hostDirectives',
];
const METADATA_DECORATORS: ReadonlySet<string> = new Set(['Component', 'Directive']);

/**
 * Stacks method decorators as route, behaviour (guards, status codes, metadata), `@ApiOperation`, other
 * Swagger parameters, responses, then `@Trace` last, so `@Trace` always wraps the bare method. Also orders
 * `@Component`/`@Directive` keys from identity over template and styles to providers and host bindings.
 */
export default createRule<Options, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: 'layout',
    fixable: 'code',
    docs: {
      description: 'One fixed order for method decorators and component metadata',
      preset: 'lite',
      frameworks: ['Angular', 'NestJS'],
    },
    schema: [],
    messages: {
      decoratorOrder: guidance({
        problem: '`@{{name}}` is out of order.',
        why: 'A fixed stack reads route first and tracing last, and `@Trace` must sit closest to the method to wrap it.',
        fix: 'Order as route, guards and other behaviour, `@ApiOperation`, other `@Api*`, responses, `@Trace` (autofixable).',
      }),
      metadataOrder: guidance({
        problem: '`{{name}}` is out of order in the component metadata.',
        why: 'With one key order every component header answers "what, which deps, how it looks, what it provides" in the same place.',
        fix: `Order keys as ${METADATA_KEYS.map((key) => `\`${key}\``).join(', ')}, then the rest (autofixable).`,
      }),
    },
  },
  defaultOptions: [],

  create(context) {
    return {
      MethodDefinition(node) {
        checkOrder(context, {
          items: node.decorators,
          rank: decoratorRank,
          name: decoratorName,
          messageId: 'decoratorOrder',
        });
      },
      Decorator(node) {
        const metadata = node.expression.type === 'CallExpression' ? node.expression.arguments[0] : null;
        if (!METADATA_DECORATORS.has(decoratorName(node) ?? '') || metadata?.type !== 'ObjectExpression') return;

        // Moving a spread changes which keys it overrides.
        const properties = metadata.properties.filter((property) => property.type === 'Property');
        if (properties.length !== metadata.properties.length) return;

        checkOrder(context, { items: properties, rank: metadataRank, name: propertyName, messageId: 'metadataOrder' });
      },
    };
  },
});

function checkOrder<T extends TSESTree.Node>(context: Context, { items, rank, name, messageId }: OrderCheck<T>): void {
  const sorted = items
    .map((item, index) => ({ item, index, rank: rank(item) }))
    .sort((a, b) => a.rank - b.rank || a.index - b.index);
  const misplaced = sorted.findIndex((entry, index) => entry.item !== items[index]);
  if (misplaced === -1) return;

  const sourceCode = context.sourceCode;
  const range: TSESTree.Range = [items[0]!.range[0], items.at(-1)!.range[1]];
  const hasComments = sourceCode
    .getAllComments()
    .some((comment) => comment.range[0] >= range[0] && comment.range[1] <= range[1]);
  const separator = sourceCode.text.slice(items[0]!.range[1], items[1]!.range[0]);
  const text = sorted.map((entry) => sourceCode.getText(entry.item)).join(separator);
  const item = sorted[misplaced]!.item;
  context.report({
    node: item,
    messageId,
    data: { name: name(item) },
    fix: hasComments ? null : (fixer) => fixer.replaceTextRange(range, text),
  });
}

function decoratorRank(decorator: TSESTree.Decorator): number {
  const name = decoratorName(decorator) ?? '';
  if (ROUTE_DECORATORS.has(name)) return 0;

  const fixed = FIXED_RANKS.get(name);
  if (fixed !== undefined) return fixed;
  if (/^Api\w*Response$/.test(name)) return RESPONSE_RANK;

  return name.startsWith('Api') ? SWAGGER_OTHER_RANK : BEHAVIOUR_RANK;
}

function metadataRank(property: TSESTree.Property): number {
  const index = METADATA_KEYS.indexOf(propertyName(property));
  return index === -1 ? METADATA_KEYS.length : index;
}

function propertyName(property: TSESTree.Property): string {
  if (property.key.type === 'Identifier') return property.key.name;

  return String('value' in property.key ? property.key.value : undefined);
}

export const RULE_DOCS_EXTENSION = {
  rationale:
    'A fixed decorator stack reads route first and tracing last: route, guards and other behaviour, `@ApiOperation`, other Swagger decorators, responses, then `@Trace`, which must sit closest to the method to wrap it. `@Component` and `@Directive` metadata keys follow one order too, so every component header answers "what, which deps, how it looks, what it provides" in the same place.',
};
