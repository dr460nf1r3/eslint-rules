import { isDirective, looksLikeCode } from '../utils/comments.js';
import { createRule } from '../utils/create-rule.js';
import { guidance } from '../utils/message.js';

export type Options = [];

export type MessageIds = 'semicolon';

export const RULE_NAME = 'no-comment-semicolon';

const CODE_REGIONS: readonly RegExp[] = [
  /```[\s\S]*?```/g,
  /@example[\s\S]*?(?=\n\s*\*?\s*@\w|$)/g,
  /`[^`\n]*`/g,
  /&#?\w+;/g,
];

/**
 * Bans `;` in comment prose. Generated comments chain clauses with semicolons constantly. Code inside
 * backticks, fenced blocks and `@example`, HTML entities, directives and commented-out code are skipped.
 */
export default createRule<Options, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow semicolons in comment prose',
      preset: 'recommended',
    },
    schema: [],
    messages: {
      semicolon: guidance({
        problem: 'Semicolon in comment prose.',
        why: 'Clauses chained with `;` make comments read like generated text and usually pack two thoughts into one line.',
        fix: 'Split it into two sentences, use a comma or "and", or drop the second clause if the code already says it.',
      }),
    },
  },
  defaultOptions: [],

  create(context) {
    const sourceCode = context.sourceCode;
    return {
      Program() {
        for (const comment of sourceCode.getAllComments()) {
          if (isDirective(comment) || (comment.type === 'Line' && looksLikeCode(comment.value))) continue;

          const valueStart = comment.range[0] + 2;
          for (const index of proseSemicolons(comment.value)) {
            const start = sourceCode.getLocFromIndex(valueStart + index);
            context.report({
              loc: { start, end: { line: start.line, column: start.column + 1 } },
              messageId: 'semicolon',
            });
          }
        }
      },
    };
  },
});

function proseSemicolons(text: string): number[] {
  const masked = CODE_REGIONS.reduce(
    (current, region) => current.replace(region, (match) => ' '.repeat(match.length)),
    text,
  );
  return [...masked.matchAll(/;/g)].map((match) => match.index);
}

export const RULE_DOCS_EXTENSION = {
  rationale:
    'Generated comments chain clauses with semicolons constantly, which makes them read like generated text and usually packs two thoughts into one line. Code inside backticks, fenced blocks and `@example`, HTML entities, directives and commented-out code are skipped, so only prose semicolons are reported.',
};
