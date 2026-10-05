import type { TSESTree } from '@typescript-eslint/utils';
import { createRule } from '../utils/create-rule.js';
import { guidance } from '../utils/message.js';

export type Options = [];

export type MessageIds = 'straySemicolon' | 'emptyBody';

export const RULE_NAME = 'no-stray-semicolon';

const STATEMENT_LISTS: ReadonlySet<string> = new Set([
  'Program',
  'BlockStatement',
  'StaticBlock',
  'SwitchCase',
  'TSModuleBlock',
]);

/**
 * Reports semicolons that terminate nothing: `;;`, `};` after declarations, and stray `;` between
 * class members. An empty statement as the body of `if`/`while`/`for` is reported without a fix,
 * because `if (ready);` almost always means the real body was lost.
 */
export default createRule<Options, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    fixable: 'code',
    docs: {
      description: 'Disallow empty statements and stray semicolons',
      preset: 'lite',
    },
    schema: [],
    messages: {
      straySemicolon: guidance({
        problem: 'Stray `;` that terminates nothing.',
        why: 'Extra semicolons are noise left by copy-paste or generated code and hide where statements really end.',
        fix: 'Delete it (autofixable).',
      }),
      emptyBody: guidance({
        problem: 'This `{{keyword}}` has an empty statement `;` as its body.',
        why: 'The statement after it runs unconditionally or only once; the intended body was almost certainly lost.',
        fix: 'Move the intended statements into a `{ ... }` block, or remove the `{{keyword}}` if nothing should happen.',
      }),
    },
  },
  defaultOptions: [],

  create(context) {
    const sourceCode = context.sourceCode;
    return {
      EmptyStatement(node) {
        if (STATEMENT_LISTS.has(node.parent.type)) {
          context.report({ node, messageId: 'straySemicolon', fix: (fixer) => fixer.remove(node) });
          return;
        }

        const keyword = sourceCode.getFirstToken(node.parent)?.value ?? '';
        context.report({ node, messageId: 'emptyBody', data: { keyword } });
      },
      ClassBody(node) {
        const strays = sourceCode
          .getTokens(node)
          .filter((token) => token.value === ';' && !node.body.some((member) => isWithin(token, member)));
        for (const token of strays) {
          context.report({ loc: token.loc, messageId: 'straySemicolon', fix: (fixer) => fixer.remove(token) });
        }
      },
    };
  },
});

function isWithin(token: TSESTree.Token, member: TSESTree.Node): boolean {
  return token.range[0] >= member.range[0] && token.range[1] <= member.range[1];
}

export const RULE_DOCS_EXTENSION = {
  rationale:
    'Extra semicolons are noise left by copy-paste or generated code and hide where statements really end, so `;;`, `};` after declarations and stray `;` between class members are removed automatically. An empty statement as the body of `if`, `while` or `for` is reported without a fix, because `if (ready);` almost always means the intended body was lost.',
};
