import type { TSESLint, TSESTree } from '@typescript-eslint/utils';
import { commentLines, isDirective, isJsDoc, lineCommentRuns, looksLikeCode, standsAlone } from '../utils/comments.js';
import { createRule } from '../utils/create-rule.js';
import { guidance } from '../utils/message.js';

export type Options = [];

export type MessageIds = 'blockComment' | 'lineRun';

export const RULE_NAME = 'comment-style';

type Context = Readonly<TSESLint.RuleContext<MessageIds, Options>>;
type SourceCode = Readonly<TSESLint.SourceCode>;

/**
 * One comment style: `//` for a single line, `/** *\/` for anything longer. Plain block comments and
 * stacked `//` lines are converted when they stand on their own lines. Inline block comments between
 * tokens are reported only, since there is no safe rewrite.
 */
export default createRule<Options, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: 'layout',
    fixable: 'code',
    docs: {
      description: 'Use // for single-line and /** */ for multi-line comments',
      preset: 'lite',
    },
    schema: [],
    messages: {
      blockComment: guidance({
        problem: 'Plain `/* */` comment.',
        why: 'The repo uses `//` for one line and `/** */` for multiple lines, so comment style says nothing about meaning.',
        fix: 'Use `// ...` for a single line or `/** ... */` for several (autofixable when the comment stands on its own line).',
      }),
      lineRun: guidance({
        problem: '{{count}} consecutive `//` lines form one multi-line comment.',
        why: 'Multi-line comments use `/** */`, which editors fold and reflow as one block.',
        fix: 'Merge them into one `/** ... */` block (autofixable).',
      }),
    },
  },
  defaultOptions: [],

  create(context) {
    const sourceCode = context.sourceCode;
    return {
      Program() {
        for (const comment of sourceCode.getAllComments()) {
          if (isPlainBlock(comment)) {
            reportBlock(context, comment);
          }
        }

        for (const run of lineCommentRuns(sourceCode)) {
          const lines = run.map((comment) => comment.value.replace(/^ /, '').trimEnd());
          if (run.length > 1 && !looksLikeCode(lines.join('\n'))) {
            reportRun(context, run, lines);
          }
        }
      },
    };
  },
});

function isPlainBlock(comment: TSESTree.Comment): boolean {
  return comment.type === 'Block' && !isJsDoc(comment) && !isDirective(comment) && !comment.value.startsWith('!');
}

function reportBlock(context: Context, comment: TSESTree.Comment): void {
  const sourceCode = context.sourceCode;
  const lines = commentLines(comment);
  const replacement = lines.length === 1 ? `// ${lines[0]}` : jsDoc(lines, indentOf(sourceCode, comment));
  context.report({
    loc: comment.loc,
    messageId: 'blockComment',
    fix: standsAlone(sourceCode, comment) ? (fixer) => fixer.replaceTextRange(comment.range, replacement) : null,
  });
}

function reportRun(context: Context, run: readonly TSESTree.Comment[], lines: readonly string[]): void {
  const first = run[0]!;
  const last = run.at(-1)!;
  context.report({
    loc: { start: first.loc.start, end: last.loc.end },
    messageId: 'lineRun',
    data: { count: run.length },
    fix: (fixer) =>
      fixer.replaceTextRange([first.range[0], last.range[1]], jsDoc(lines, indentOf(context.sourceCode, first))),
  });
}

function indentOf(sourceCode: SourceCode, comment: TSESTree.Comment): string {
  return sourceCode.lines[comment.loc.start.line - 1]!.slice(0, comment.loc.start.column);
}

function jsDoc(lines: readonly string[], indent: string): string {
  const body = lines.map((line) => (line === '' ? `${indent} *` : `${indent} * ${line}`)).join('\n');
  return `/**\n${body}\n${indent} */`;
}

export const RULE_DOCS_EXTENSION = {
  rationale:
    'One comment style means the style itself carries no meaning: `//` for a single line and `/** */` for anything longer, which editors fold and reflow as one block. Plain block comments and stacked `//` lines are converted automatically when they stand on their own lines, while inline block comments between tokens are only reported because there is no safe rewrite.',
};
