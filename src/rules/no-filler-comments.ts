import { commentLines, isDirective } from '../utils/comments.js';
import { createRule } from '../utils/create-rule.js';
import { guidance } from '../utils/message.js';

export type Options = [];

export type MessageIds = 'filler' | 'divider';

export const RULE_NAME = 'no-filler-comments';

const FILLER: readonly RegExp[] = [
  /^(this|the following) (function|method|class|component|service|helper|code|block|line|variable|constant|property|file|module)\b/i,
  /\bhelper (function |method )?(to|that|for)\b/i,
  /\b(simply|basically|essentially|obviously|clearly|actually)\b/i,
  /\bnote that\b/i,
  /\bit(?: is|'s) (important|worth noting|crucial|essential)\b/i,
  /\bin order to\b/i,
  /\bwe (need|want|have) to\b/i,
  /^here we\b/i,
  /\bas (mentioned|described|shown) (above|below|earlier)\b/i,
];
const DIVIDER = /^[-=*#_~+.\s/]{3,}$|^[-=*#_~]{3,}.*[-=*#_~]{3,}$/;
const LABEL =
  /^(imports?|exports?|constructor|getters?|setters?|(public |private |protected )?methods?|properties|fields|variables|constants|helpers?( functions)?|utils|utilities|lifecycle( hooks)?|inputs?|outputs?|signals?|state|computed|effects|types|interfaces|handlers|event handlers|injections?|dependencies|services|init|initiali[sz]ation|public api|public|private)\s*:?$/i;

/**
 * Flags padding phrases ("This method…", "Simply", "Note that", "In order to") and section
 * dividers or labels (`// --- Helpers ---`, `// Constructor`) that structure code with comments
 * instead of with files and names.
 */
export default createRule<Options, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow filler phrasing and section-divider comments',
      preset: 'recommended',
    },
    schema: [],
    messages: {
      filler: guidance({
        problem: 'Comment uses filler phrasing: "{{text}}".',
        why: 'Phrases like "This method", "simply", "note that" and "in order to" pad comments without adding information.',
        fix: 'Delete the filler and keep only the fact, e.g. "B1 rounds per line". If nothing is left, delete the comment.',
      }),
      divider: guidance({
        problem: 'Section divider or label comment: "{{text}}".',
        why: 'Dividers and labels like "// Helpers" structure a file that is too big. Names and files should carry the structure.',
        fix: 'Delete it. If the file needs sections, split it into smaller files along those sections.',
      }),
    },
  },
  defaultOptions: [],

  create(context) {
    return {
      Program() {
        for (const comment of context.sourceCode.getAllComments()) {
          if (isDirective(comment)) continue;

          const text = (comment.type === 'Line' ? comment.value : commentLines(comment).join(' ')).trim();
          const messageId = classify(text);
          if (!messageId) continue;

          context.report({
            loc: comment.loc,
            messageId,
            data: { text: text.length > 50 ? `${text.slice(0, 47)}...` : text },
          });
        }
      },
    };
  },
});

function classify(text: string): MessageIds | undefined {
  if (DIVIDER.test(text) || LABEL.test(text)) return 'divider';

  const unquoted = text.replace(/"[^"]*"|`[^`]*`/g, '');
  return FILLER.some((pattern) => pattern.test(unquoted)) ? 'filler' : undefined;
}

export const RULE_DOCS_EXTENSION = {
  rationale:
    'Phrases like "This method", "simply", "note that" and "in order to" pad comments without adding information. Section dividers and labels such as `// --- Helpers ---` or `// Constructor` structure a file that is too big, when names and files should carry that structure instead.',
};
