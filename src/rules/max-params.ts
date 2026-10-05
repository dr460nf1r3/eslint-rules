import type { TSESTree } from '@typescript-eslint/utils';
import { functionName, paramName } from '../utils/ast.js';
import { createRule } from '../utils/create-rule.js';
import { guidance } from '../utils/message.js';

export type Options = [{ max?: number }];

export type MessageIds = 'tooMany';

export const RULE_NAME = 'max-params';

type FunctionNode = TSESTree.FunctionDeclaration | TSESTree.FunctionExpression | TSESTree.ArrowFunctionExpression;

/**
 * Limits plain function parameters. Decorated parameters (Nest's `@User`, `@Body`, ...) are framework
 * wiring, and constructor parameters are injected dependencies (see `max-dependencies`), so neither counts.
 */
export default createRule<Options, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Limit undecorated function parameters; group them into a parameter object',
      preset: 'recommended',
    },
    schema: [
      {
        type: 'object',
        properties: { max: { type: 'integer', minimum: 0, description: 'Maximum number of undecorated parameters.' } },
        additionalProperties: false,
      },
    ],
    messages: {
      tooMany: guidance({
        problem: '{{name}} takes {{count}} parameters, more than the maximum of {{max}}.',
        why: 'Long parameter lists are easy to call in the wrong order and usually hide a concept that deserves a name.',
        fix: 'Introduce a parameter object: {{name}}(options: { {{params}} }) and destructure it inside, or move the data clump into a named type.',
      }),
    },
  },
  defaultOptions: [{ max: 3 }],

  create(context, [{ max = 3 }]) {
    function check(node: FunctionNode): void {
      if (node.parent.type === 'MethodDefinition' && node.parent.kind === 'constructor') return;

      const counted = node.params.filter((param) => !('decorators' in param && param.decorators.length > 0));
      if (counted.length <= max) return;

      context.report({
        node,
        messageId: 'tooMany',
        data: { name: functionName(node), count: counted.length, max, params: counted.map(paramName).join(', ') },
      });
    }

    return { FunctionDeclaration: check, FunctionExpression: check, ArrowFunctionExpression: check };
  },
});

export const RULE_DOCS_EXTENSION = {
  rationale:
    'Long parameter lists are easy to call in the wrong order and usually hide a concept that deserves a name. Decorated parameters are framework wiring (Nest route handlers) and constructor parameters are injected dependencies, which `max-dependencies` limits instead.',
};
