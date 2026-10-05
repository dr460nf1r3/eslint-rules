import { commentUnits, isJsDoc, looksLikeCode, unitText } from '../utils/comments.js';
import { createRule } from '../utils/create-rule.js';
import { guidance } from '../utils/message.js';

export type Options = [];

export type MessageIds = 'commentedCode';

export const RULE_NAME = 'no-commented-out-code';

/**
 * Reports comments whose text parses as code. Consecutive `//` lines are judged together so a
 * commented-out block is one report.
 */
export default createRule<Options, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow commented-out code',
      preset: 'lite',
    },
    schema: [],
    messages: {
      commentedCode: guidance({
        problem: 'Commented-out code.',
        why: 'Dead code in comments rots, confuses readers about what runs, and git already keeps the history.',
        fix: 'Delete it. If it documents a deliberate alternative, replace it with a one-line `//` comment explaining why.',
      }),
    },
  },
  defaultOptions: [],

  create(context) {
    return {
      Program() {
        for (const unit of commentUnits(context.sourceCode)) {
          const first = unit[0]!;
          if (isJsDoc(first) || !looksLikeCode(unitText(unit))) continue;

          context.report({ loc: { start: first.loc.start, end: unit.at(-1)!.loc.end }, messageId: 'commentedCode' });
        }
      },
    };
  },
});

export const RULE_DOCS_EXTENSION = {
  rationale:
    'Dead code in comments rots, confuses readers about what actually runs, and git already keeps the history. A comment counts as code when its text parses as more than a bare word or label, and consecutive `//` lines are judged together so a commented-out block is reported once.',
};
