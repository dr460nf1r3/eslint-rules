import type { TSESLint, TSESTree } from '@typescript-eslint/utils';
import { commentLines, commentUnits, isJsDoc } from '../utils/comments.js';
import { createRule } from '../utils/create-rule.js';
import { guidance } from '../utils/message.js';

export type Options = [{ body?: number; docDescription?: number; other?: number }];

export type MessageIds = 'bodyComment' | 'docDescription' | 'otherComment';

export const RULE_NAME = 'max-comment-lines';

type SourceCode = Readonly<TSESLint.SourceCode>;
type Limit = 'body' | 'docDescription' | 'other';

const DEFAULTS = { body: 3, docDescription: 6, other: 4 };
const LIMIT_OF: Record<MessageIds, Limit> = {
  bodyComment: 'body',
  docDescription: 'docDescription',
  otherComment: 'other',
};
const FUNCTION_TYPES: ReadonlySet<string> = new Set([
  'FunctionDeclaration',
  'FunctionExpression',
  'ArrowFunctionExpression',
]);

/**
 * Caps comment length: comments inside function bodies, JSDoc descriptions (tags excluded) and
 * everything else each have their own limit. Long explanations belong in docs or the commit message.
 */
export default createRule<Options, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Limit comment length',
      preset: 'recommended',
    },
    schema: [
      {
        type: 'object',
        properties: {
          body: { type: 'integer', description: 'Maximum lines of a comment inside a function body.' },
          docDescription: { type: 'integer', description: 'Maximum lines of a JSDoc description, tags excluded.' },
          other: { type: 'integer', description: 'Maximum lines of any other comment.' },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      bodyComment: guidance({
        problem: 'Comment inside a function body has {{count}} lines, more than {{max}}.',
        why: 'A long explanation inside a function means the code is not saying enough itself, or the text is padding.',
        fix: 'Cut it to the one non-obvious reason. Extract a well-named function for the rest, and move background to the docs or the commit message.',
      }),
      docDescription: guidance({
        problem: 'JSDoc description has {{count}} lines, more than {{max}}.',
        why: 'Doc comments are read in hover popups. Past a few lines they are skipped.',
        fix: 'Keep the contract (what, preconditions, side effects) and move background and history to the docs.',
      }),
      otherComment: guidance({
        problem: 'Comment has {{count}} lines, more than {{max}}.',
        why: 'Long comments are skipped by readers and drift from the code.',
        fix: 'Shorten it to what the code cannot say, and move the rest to the docs.',
      }),
    },
  },
  defaultOptions: [DEFAULTS],

  create(context, [options]) {
    const limits = { ...DEFAULTS, ...options };
    const sourceCode = context.sourceCode;
    return {
      Program() {
        for (const unit of commentUnits(sourceCode)) {
          const { messageId, count } = measure(sourceCode, unit);
          const max = limits[LIMIT_OF[messageId]];
          if (count <= max) continue;

          context.report({
            loc: { start: unit[0]!.loc.start, end: unit.at(-1)!.loc.end },
            messageId,
            data: { count, max },
          });
        }
      },
    };
  },
});

function measure(sourceCode: SourceCode, unit: readonly TSESTree.Comment[]): { messageId: MessageIds; count: number } {
  const first = unit[0]!;
  if (isJsDoc(first)) {
    const lines = commentLines(first);
    const firstTag = lines.findIndex((line) => line.startsWith('@'));
    return { messageId: 'docDescription', count: firstTag === -1 ? lines.length : firstTag };
  }

  const count = unit.at(-1)!.loc.end.line - first.loc.start.line + 1;
  return { messageId: isInsideFunction(sourceCode, first) ? 'bodyComment' : 'otherComment', count };
}

function isInsideFunction(sourceCode: SourceCode, comment: TSESTree.Comment): boolean {
  for (let node = sourceCode.getNodeByRangeIndex(comment.range[0]); node; node = node.parent ?? null) {
    if (FUNCTION_TYPES.has(node.type)) return true;
  }

  return false;
}

export const RULE_DOCS_EXTENSION = {
  rationale:
    'Long comments are skipped by readers and drift from the code. A long explanation inside a function means the code is not saying enough itself, and doc comments are read in hover popups where a few lines is the most anyone reads. Comments inside function bodies, JSDoc descriptions (tags excluded) and everything else each get their own limit, and the background belongs in the docs or the commit message.',
};
