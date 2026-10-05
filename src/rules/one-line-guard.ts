import type { TSESLint, TSESTree } from '@typescript-eslint/utils';
import { createRule } from '../utils/create-rule.js';
import { guidance } from '../utils/message.js';

export type Options = [{ printWidth?: number }];

export type MessageIds = 'oneLine' | 'braces';

export const RULE_NAME = 'one-line-guard';

type SourceCode = Readonly<TSESLint.SourceCode>;

const JUMPS: ReadonlySet<string> = new Set([
  'ReturnStatement',
  'ContinueStatement',
  'BreakStatement',
  'ThrowStatement',
]);
const DEFAULT_PRINT_WIDTH = 120;

/**
 * Gives every `if` without `else` exactly one valid shape. A jump body (`return`, `continue`, `break`, `throw`)
 * goes on the `if` line without braces when that line fits the print width, otherwise it gets braces.
 * Any other single statement always gets braces, so a one-line `if` always means "leave here".
 */
export default createRule<Options, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: 'layout',
    fixable: 'code',
    docs: { description: 'One-line guards for short jumps, braces for everything else', preset: 'lite' },
    schema: [
      {
        type: 'object',
        properties: {
          printWidth: {
            type: 'integer',
            minimum: 1,
            description: "Maximum line length a one-line guard may reach, usually Prettier's `printWidth`.",
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      oneLine: guidance({
        problem: 'This guard fits on one line.',
        why: 'Short guards read as a single "leave here" step; braces and extra lines make the early exits look like regular logic.',
        fix: 'Write it as `if (condition) return …;` on one line (autofixable).',
      }),
      braces: guidance({
        problem: 'This `if` body needs braces on its own lines.',
        why: 'Only short jumps may sit on the `if` line. A longer guard would be wrapped by Prettier, and a one-line state change is easy to miss.',
        fix: 'Wrap the body in `{ … }` across several lines (autofixable).',
      }),
    },
  },
  defaultOptions: [{ printWidth: DEFAULT_PRINT_WIDTH }],

  create(context, [{ printWidth = DEFAULT_PRINT_WIDTH }]) {
    const sourceCode = context.sourceCode;
    return {
      IfStatement(node) {
        const body = singleStatement(node.consequent);
        if (node.alternate || isElseIf(node) || !body || hasComments(sourceCode, node)) return;

        const oneLine = oneLineText(sourceCode, node, body);
        const fitsOneLine =
          JUMPS.has(body.type) && oneLine !== null && node.loc.start.column + oneLine.length <= printWidth;
        if (fitsOneLine && sourceCode.getText(node) !== oneLine) {
          context.report({ node, messageId: 'oneLine', fix: (fixer) => fixer.replaceText(node, oneLine) });
          return;
        }

        if (!fitsOneLine && node.consequent.type !== 'BlockStatement') {
          const text = bracedText(sourceCode, node, body);
          context.report({ node, messageId: 'braces', fix: (fixer) => fixer.replaceText(node, text) });
        }
      },
    };
  },
});

function singleStatement(consequent: TSESTree.Statement): TSESTree.Statement | null {
  if (consequent.type !== 'BlockStatement') return consequent;
  if (consequent.body.length !== 1) return null;

  return consequent.body[0]!;
}

function isElseIf(node: TSESTree.IfStatement): boolean {
  return node.parent.type === 'IfStatement' && node.parent.alternate === node;
}

function hasComments(sourceCode: SourceCode, node: TSESTree.Node): boolean {
  return sourceCode.getCommentsInside(node).length > 0;
}

function oneLineText(sourceCode: SourceCode, node: TSESTree.IfStatement, body: TSESTree.Statement): string | null {
  const test = sourceCode.getText(node.test);
  const statement = sourceCode.getText(body);
  if (test.includes('\n') || statement.includes('\n')) return null;

  return `if (${test}) ${statement}`;
}

function bracedText(sourceCode: SourceCode, node: TSESTree.IfStatement, body: TSESTree.Statement): string {
  const indent = /^\s*/.exec(sourceCode.lines[node.loc.start.line - 1]!)![0];
  return `if (${sourceCode.getText(node.test)}) {\n${indent}  ${sourceCode.getText(body)}\n${indent}}`;
}

export const RULE_DOCS_EXTENSION = {
  rationale:
    'Short guards read as a single "leave here" step, while braces and extra lines make early exits look like regular logic. Only short jumps (`return`, `continue`, `break`, `throw`) that fit the print width may sit on the `if` line; every other body gets braces, because a one-line state change is easy to miss. A one-line `if` therefore always means "leave here".',
};
