import type { TSESTree } from '@typescript-eslint/utils';
import { createRule } from '../utils/create-rule.js';
import { guidance } from '../utils/message.js';

export type Options = [];

export type MessageIds = 'artifact' | 'stub';

export const RULE_NAME = 'no-llm-artifacts';

const ARTIFACT_PATTERNS: readonly RegExp[] = [
  /\.\.\.\s*(existing|rest of|previous|other|remaining)\b/i,
  /\b(remains?|stays?) (the )?(same|unchanged)\b/i,
  /\bTODO:?\s*implement\b/i,
  /\byour (code|logic|implementation) (goes )?here\b/i,
  /\bomitted for brevity\b/i,
  /\bsame as (above|before)\b/i,
  /\badd (more )?\w+ as needed\b/i,
  /\bcontinue from here\b/i,
  /\bsee implementation above\b/i,
  /\bexisting code\b/i,
];
const NOT_IMPLEMENTED = /not( yet)? implemented/i;

/**
 * Catches placeholders a code generator leaves behind: elision markers in comments and functions
 * that only throw "not implemented".
 */
export default createRule<Options, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow placeholder comments and not-implemented stubs',
      preset: 'lite',
    },
    schema: [],
    messages: {
      artifact: guidance({
        problem: 'Placeholder comment "{{text}}".',
        why: 'Elision markers mean code was skipped or truncated; the file may be incomplete.',
        fix: 'Write the missing code or delete the comment.',
      }),
      stub: guidance({
        problem: 'This function only throws "not implemented".',
        why: 'Stubs compile and pass review but fail at runtime.',
        fix: 'Implement it, or remove it and its callers until it is needed.',
      }),
    },
  },
  defaultOptions: [],

  create(context) {
    return {
      'Program'() {
        for (const comment of context.sourceCode.getAllComments()) {
          if (!ARTIFACT_PATTERNS.some((pattern) => pattern.test(comment.value))) continue;

          context.report({ loc: comment.loc, messageId: 'artifact', data: { text: comment.value.trim() } });
        }
      },
      'ThrowStatement > NewExpression.argument'(node: TSESTree.NewExpression) {
        const [message] = node.arguments;
        if (message?.type !== 'Literal' || !NOT_IMPLEMENTED.test(String(message.value))) return;

        context.report({ node: node.parent, messageId: 'stub' });
      },
    };
  },
});

export const RULE_DOCS_EXTENSION = {
  rationale:
    'Code generators leave placeholders behind: elision markers such as "... existing code ..." or "omitted for brevity" mean code was skipped or truncated and the file may be incomplete. Functions that only throw "not implemented" compile and pass review but fail at runtime.',
};
