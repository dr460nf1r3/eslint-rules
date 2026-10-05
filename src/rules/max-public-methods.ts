import type { TSESTree } from '@typescript-eslint/utils';
import type { ClassNode } from '../utils/ast.js';
import { createRule } from '../utils/create-rule.js';
import { guidance } from '../utils/message.js';

export type Options = [{ max?: number }];

export type MessageIds = 'tooMany';

export const RULE_NAME = 'max-public-methods';

const ANGULAR_LIFECYCLE_HOOK = /^ng[A-Z]/;

/**
 * Limits the public surface of a class. Accessors, private members and Angular lifecycle hooks are
 * not part of what callers depend on, so they don't count.
 */
export default createRule<Options, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Limit public methods per class (interface segregation)',
      preset: 'recommended',
    },
    schema: [
      {
        type: 'object',
        properties: {
          max: { type: 'integer', minimum: 0, description: 'Maximum number of public methods per class.' },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      tooMany: guidance({
        problem: '{{name}} exposes {{count}} public methods, more than the maximum of {{max}}.',
        why: 'A wide public surface forces every caller to depend on methods it never uses and hides several responsibilities in one class.',
        fix: 'Group the methods by the callers that use them and split {{name}} along those groups; keep {{name}} as a thin facade only if callers really need it.',
      }),
    },
  },
  defaultOptions: [{ max: 10 }],

  create(context, [{ max = 10 }]) {
    function check(node: ClassNode): void {
      const count = node.body.body.filter(isPublicMethod).length;
      if (count <= max) return;

      context.report({
        node: node.id ?? node,
        messageId: 'tooMany',
        data: { name: node.id?.name ?? 'class', count, max },
      });
    }
    return { ClassDeclaration: check, ClassExpression: check };
  },
});

function isPublicMethod(member: TSESTree.ClassElement): boolean {
  if (member.type !== 'MethodDefinition' || member.kind !== 'method') return false;
  if (member.key.type === 'PrivateIdentifier') return false;
  if (member.accessibility === 'private' || member.accessibility === 'protected') return false;

  return !ANGULAR_LIFECYCLE_HOOK.test(member.key.type === 'Identifier' ? member.key.name : '');
}

export const RULE_DOCS_EXTENSION = {
  rationale:
    'A wide public surface forces every caller to depend on methods it never uses and hides several responsibilities in one class (interface segregation). Accessors, private and protected members and Angular lifecycle hooks are not part of what callers depend on, so they do not count.',
};
