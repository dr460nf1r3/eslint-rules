import type { TSESLint, TSESTree } from '@typescript-eslint/utils';
import { createRule } from '../utils/create-rule.js';
import { guidance } from '../utils/message.js';

export type Options = [{ attachConnected?: boolean }];

export type MessageIds = 'missing' | 'unexpected' | 'connected';

export const RULE_NAME = 'blank-lines';

type SourceCode = Readonly<TSESLint.SourceCode>;

/** A block with this many statements or more gets a blank line before its return. */
const MIN_STATEMENTS_FOR_PADDING = 3;
const LOOPS: ReadonlySet<string> = new Set([
  'ForStatement',
  'ForInStatement',
  'ForOfStatement',
  'WhileStatement',
  'DoWhileStatement',
]);

/**
 * A statement that reads a variable declared directly above it stays attached to that declaration.
 * Otherwise a `return` gets a blank line before it in blocks with more than two statements. After an
 * `if`, a loop or a block, `@stylistic/padding-line-between-statements` decides.
 */
export default createRule<Options, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: 'layout',
    fixable: 'whitespace',
    docs: {
      description: 'Blank lines before returns by block size, none between a declaration and the statement reading it',
      preset: 'lite',
    },
    schema: [
      {
        type: 'object',
        properties: {
          attachConnected: {
            type: 'boolean',
            description:
              'Keep a statement attached to the declaration it reads. The presets set it to `false` in test files, so setup and assertions stay apart.',
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      missing: guidance({
        problem: 'Add a blank line before this return. The block has more than two statements.',
        why: 'In longer blocks the blank line sets the result apart from the steps that compute it.',
        fix: 'Insert one blank line before the return (autofixable).',
      }),
      unexpected: guidance({
        problem: 'Remove the blank line before this return. The block has only two statements.',
        why: 'A two-statement block reads as one step; a blank line splits it for no reason.',
        fix: 'Remove the blank line (autofixable).',
      }),
      connected: guidance({
        problem: 'Remove the blank line before this statement. It reads the variable declared directly above it.',
        why: 'A declaration and its first use belong together; a blank line suggests they are unrelated.',
        fix: 'Remove the blank line (autofixable).',
      }),
    },
  },
  defaultOptions: [{ attachConnected: true }],

  create(context, [{ attachConnected = true }]) {
    const sourceCode = context.sourceCode;
    function checkStatement(statements: readonly TSESTree.Node[], index: number): void {
      const statement = statements[index]!;
      const previous = statements[index - 1]!;
      if (isBlockLike(sourceCode, previous)) return;

      // A comment between the two statements is left alone, so the fix never moves it.
      const tokenBefore = sourceCode.getTokenBefore(statement, { includeComments: true });
      if (!tokenBefore || tokenBefore.type === 'Line' || tokenBefore.type === 'Block') return;

      const hasBlankLine = statement.loc.start.line - tokenBefore.loc.end.line > 1;
      const connected = attachConnected && readsDeclarationOf(sourceCode, statement, previous);
      if (!connected && statement.type !== 'ReturnStatement') return;

      const wantsBlankLine = !connected && statements.length >= MIN_STATEMENTS_FOR_PADDING;
      if (hasBlankLine === wantsBlankLine) return;

      if (wantsBlankLine) {
        context.report({
          node: statement,
          messageId: 'missing',
          fix: (fixer) => fixer.insertTextAfter(tokenBefore, '\n'),
        });
        return;
      }

      const indentation = ' '.repeat(statement.loc.start.column);
      context.report({
        node: statement,
        messageId: connected ? 'connected' : 'unexpected',
        fix: (fixer) => fixer.replaceTextRange([tokenBefore.range[1], statement.range[0]], `\n${indentation}`),
      });
    }

    function checkStatements(statements: readonly TSESTree.Node[]): void {
      for (let index = 1; index < statements.length; index++) checkStatement(statements, index);
    }

    return {
      BlockStatement: (node) => checkStatements(node.body),
      SwitchCase: (node) => checkStatements(node.consequent),
    };
  },
});

/** Same test as `@stylistic/padding-line-between-statements` for `if` and `block-like`, plus loops. */
function isBlockLike(sourceCode: SourceCode, statement: TSESTree.Node): boolean {
  if (statement.type === 'IfStatement' || LOOPS.has(statement.type)) return true;

  const lastToken = sourceCode.getLastToken(statement, (token) => token.value !== ';');
  if (lastToken?.value !== '}') return false;

  const owner = sourceCode.getNodeByRangeIndex(lastToken.range[0]);
  return owner?.type === 'BlockStatement' || owner?.type === 'SwitchStatement';
}

function readsDeclarationOf(sourceCode: SourceCode, statement: TSESTree.Node, declaration: TSESTree.Node): boolean {
  if (declaration.type !== 'VariableDeclaration') return false;

  return sourceCode.getDeclaredVariables(declaration).some((variable) =>
    variable.references.some((reference) => {
      const [start, end] = reference.identifier.range;
      return start >= statement.range[0] && end <= statement.range[1];
    }),
  );
}

export const RULE_DOCS_EXTENSION = {
  rationale:
    'Prettier keeps blank lines but never adds or removes them, so their placement drifts. This rule fixes two cases: a `return` gets a blank line before it in blocks of three or more statements and none in shorter ones, and a statement that reads the variable declared directly above it stays attached to that declaration. After an `if`, a loop or a block it defers to `@stylistic/padding-line-between-statements`, which the presets configure to require a blank line there. Comments between statements are left alone.',
};
