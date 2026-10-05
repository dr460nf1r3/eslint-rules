import type { TSESTree } from '@typescript-eslint/utils';
import { enclosingClass, isDiClass } from '../utils/ast.js';
import { createRule } from '../utils/create-rule.js';
import { guidance } from '../utils/message.js';

export type Options = [];

export type MessageIds = 'newDependency';

export const RULE_NAME = 'no-new-service';

const COLLABORATOR = /(Service|Repository|Client|Gateway)$/;

/**
 * Reports `new XService()` and similar inside DI-created classes. Collaborators constructed by hand
 * can't be swapped in tests or configured centrally (dependency inversion).
 */
export default createRule<Options, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Inject collaborators instead of constructing them (dependency inversion)',
      preset: 'recommended',
      frameworks: ['Angular', 'NestJS'],
    },
    schema: [],
    messages: {
      newDependency: guidance({
        problem: '{{name}} is constructed with `new` inside {{owner}}.',
        why: 'A hand-built collaborator is a hidden, concrete dependency: it cannot be mocked in tests or replaced through DI.',
        fix: 'Inject it instead: `private readonly {{field}} = inject({{name}})` in Angular, or a constructor parameter in Nest. Register it as a provider if it is not one yet.',
      }),
    },
  },
  defaultOptions: [],

  create(context) {
    return {
      NewExpression(node: TSESTree.NewExpression) {
        const name = node.callee.type === 'Identifier' ? node.callee.name : undefined;
        if (!name || !COLLABORATOR.test(name)) return;

        const owner = enclosingClass(node);
        if (!owner || !isDiClass(owner)) return;

        context.report({
          node,
          messageId: 'newDependency',
          data: { name, owner: owner.id?.name ?? 'this class', field: name.charAt(0).toLowerCase() + name.slice(1) },
        });
      },
    };
  },
});

export const RULE_DOCS_EXTENSION = {
  rationale:
    'A collaborator built with `new` inside a DI-created class is a hidden, concrete dependency: it cannot be mocked in tests, replaced through DI or configured centrally. Names ending in Service, Repository, Client or Gateway are treated as collaborators; value objects, exceptions and construction outside DI classes (factories, bootstrap code) are left alone.',
};
