import type { TSESLint, TSESTree } from '@typescript-eslint/utils';
import { commentUnits, isJsDoc, looksLikeCode, standsAlone, unitText } from '../utils/comments.js';
import { createRule } from '../utils/create-rule.js';
import { guidance } from '../utils/message.js';
import { codeWords, coverage, proseWords, WHY_WORDS } from '../utils/words.js';

export type Options = [];

export type MessageIds = 'restates';

export const RULE_NAME = 'no-restating-comment';

type SourceCode = Readonly<TSESLint.SourceCode>;

const RESTATING_COVERAGE = 0.75;

/**
 * Flags comments whose words the code next to them already says: "Set loading to true" above
 * `this.loading.set(true)`, or `count = 0; // reset count`. Verbs are matched as concepts, so
 * "Loop over all lines" matches `for (const line of lines)`. Comments with a reason are kept.
 */
export default createRule<Options, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow comments that restate the adjacent code',
      preset: 'recommended',
    },
    schema: [],
    messages: {
      restates: guidance({
        problem: 'Comment "{{text}}" restates the code next to it.',
        why: 'What-comments repeat the code, double the reading and go stale when the code changes.',
        fix: 'Delete it. If the code is not clear on its own, rename or extract until it is. Keep a comment only for a non-obvious reason (an SAP quirk, a constraint).',
      }),
    },
  },
  defaultOptions: [],

  create(context) {
    const sourceCode = context.sourceCode;
    return {
      Program() {
        for (const unit of commentUnits(sourceCode)) {
          const first = unit[0]!;
          const text = unitText(unit).replace(/\s+/g, ' ').trim();
          if (isJsDoc(first) || WHY_WORDS.test(text) || looksLikeCode(text)) continue;

          const tokens = adjacentCodeTokens(sourceCode, unit);
          if (tokens.length === 0 || coverage(proseWords(text), codeWords(tokens)) < RESTATING_COVERAGE) continue;

          context.report({
            loc: { start: first.loc.start, end: unit.at(-1)!.loc.end },
            messageId: 'restates',
            data: { text },
          });
        }
      },
    };
  },
});

function adjacentCodeTokens(sourceCode: SourceCode, unit: readonly TSESTree.Comment[]): TSESTree.Token[] {
  const last = unit.at(-1)!;
  if (standsAlone(sourceCode, last)) {
    const next = sourceCode.getTokenAfter(last);
    return next ? tokensOnLine(sourceCode, next.loc.start.line) : [];
  }

  const previous = sourceCode.getTokenBefore(last);
  const isTrailing = last.type === 'Line' && previous?.loc.end.line === last.loc.start.line;
  return isTrailing ? tokensOnLine(sourceCode, last.loc.start.line) : [];
}

function tokensOnLine(sourceCode: SourceCode, line: number): TSESTree.Token[] {
  return sourceCode.ast.tokens.filter((token) => token.loc.start.line === line);
}

export const RULE_DOCS_EXTENSION = {
  rationale:
    'What-comments repeat the code, double the reading and go stale when the code changes. The rule compares a comment\'s words with the adjacent line, matching verbs as concepts so "Loop over all lines" matches `for (const line of lines)`. Comments that give a reason (because, otherwise, an SAP quirk) are kept.',
};
