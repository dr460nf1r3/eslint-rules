import type { TSESTree } from '@typescript-eslint/utils';
import type { ClassNode } from '../utils/ast.js';
import { isDiClass } from '../utils/ast.js';
import { createRule } from '../utils/create-rule.js';
import { guidance } from '../utils/message.js';

export type Options = [{ max?: number }];

export type MessageIds = 'tooMany';

export const RULE_NAME = 'max-dependencies';

/**
 * Limits how many collaborators a DI-created class pulls in, counting constructor parameters and
 * `inject(...)` field initializers. A long dependency list is the most reliable sign of a class with
 * more than one reason to change.
 */
export default createRule<Options, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Limit injected dependencies per class (single responsibility)',
      preset: 'recommended',
      frameworks: ['Angular', 'NestJS'],
    },
    schema: [
      {
        type: 'object',
        properties: {
          max: {
            type: 'integer',
            minimum: 0,
            description: 'Maximum number of constructor parameters plus `inject()` fields.',
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      tooMany: guidance({
        problem: '{{name}} has {{count}} injected dependencies, more than the maximum of {{max}}.',
        why: 'Each dependency is a reason to change; this many usually means the class owns several responsibilities.',
        fix: 'Find the dependencies that are only used together and move them, with the methods that use them, into a focused service that {{name}} injects instead.',
      }),
    },
  },
  defaultOptions: [{ max: 5 }],

  create(context, [{ max = 5 }]) {
    function check(node: ClassNode): void {
      if (!isDiClass(node)) return;

      const count = constructorParamCount(node) + injectFieldCount(node);
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

function constructorParamCount(classNode: ClassNode): number {
  const constructor = classNode.body.body.find(
    (member): member is TSESTree.MethodDefinition =>
      member.type === 'MethodDefinition' && member.kind === 'constructor',
  );
  return constructor?.value.params.length ?? 0;
}

function injectFieldCount(classNode: ClassNode): number {
  return classNode.body.body.filter(
    (member) =>
      member.type === 'PropertyDefinition' &&
      member.value?.type === 'CallExpression' &&
      member.value.callee.type === 'Identifier' &&
      member.value.callee.name === 'inject',
  ).length;
}

export const RULE_DOCS_EXTENSION = {
  rationale:
    'Each injected dependency is a reason to change, so a long dependency list is the most reliable sign of a class with several responsibilities. The rule counts constructor parameters and `inject(...)` field initializers together, and only for classes a DI container creates (Nest or Angular).',
};
