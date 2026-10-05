import type { TSESLint, TSESTree } from '@typescript-eslint/utils';
import { isInjectedField, visibility } from '../utils/class-members.js';
import type { ClassMember } from '../utils/class-members.js';
import { createRule } from '../utils/create-rule.js';
import { guidance } from '../utils/message.js';

export type Options = [];

export type MessageIds = 'blankRequired' | 'blankForbidden';

export const RULE_NAME = 'statement-spacing';

type SourceCode = Readonly<TSESLint.SourceCode>;
type Context = Readonly<TSESLint.RuleContext<MessageIds, Options>>;
type Statement = TSESTree.ProgramStatement;
type Expectation = 'blank' | 'none';
type Spaced = Statement | ClassMember;

interface Shape {
  isImport: boolean;
  isExport: boolean;
  isGuard: boolean;
  isBlockLike: boolean;
  isDeclaration: boolean;
  isMultiline: boolean;
}

interface Pair {
  prev: Shape;
  next: Shape;
  prevNode: TSESTree.Node;
  nextNode: TSESTree.Node;
  sourceCode: SourceCode;
  isFinalReturn: boolean;
  isShort: boolean;
}

interface SpacingRule {
  reason: string;
  expect: Expectation;
}

interface StatementRule extends SpacingRule {
  applies: (pair: Pair) => boolean;
}

const BLOCK_LIKE: ReadonlySet<string> = new Set([
  'IfStatement',
  'ForStatement',
  'ForInStatement',
  'ForOfStatement',
  'WhileStatement',
  'DoWhileStatement',
  'SwitchStatement',
  'TryStatement',
  'BlockStatement',
  'LabeledStatement',
]);
const SHORT_BLOCK = 2;
const BLANK = 'blank';
const NONE = 'none';
/**
 * Decides the blank line between two neighbouring statements from their shapes alone, so the layout of a
 * function never depends on taste. Pairs no rule covers (two expression statements, an expression before
 * a declaration) keep whatever the author wrote. The first matching rule wins.
 */
const STATEMENT_RULES: readonly StatementRule[] = [
  { reason: 'imports form one group', applies: (pair) => pair.prev.isImport && pair.next.isImport, expect: NONE },
  { reason: 'the import group ends here', applies: (pair) => pair.prev.isImport, expect: BLANK },
  { reason: 'each export stands apart', applies: (pair) => pair.prev.isExport || pair.next.isExport, expect: BLANK },
  {
    reason: 'the final `return` of a longer block stands apart',
    applies: (pair) => pair.isFinalReturn && !pair.isShort,
    expect: BLANK,
  },
  { reason: 'a declaration stays attached to the statement that reads it', applies: declarationConsumed, expect: NONE },
  {
    reason: 'consecutive one-line guards form one group',
    applies: (pair) => pair.prev.isGuard && pair.next.isGuard,
    expect: NONE,
  },
  { reason: 'a group of one-line guards ends here', applies: (pair) => pair.prev.isGuard, expect: BLANK },
  { reason: 'a group of one-line guards starts here', applies: (pair) => pair.next.isGuard, expect: BLANK },
  { reason: 'a block statement ends here', applies: (pair) => pair.prev.isBlockLike, expect: BLANK },
  { reason: 'a block statement starts here', applies: (pair) => pair.next.isBlockLike, expect: BLANK },
  {
    reason: 'the final `return` of a short block stays compact',
    applies: (pair) => pair.isFinalReturn && pair.isShort,
    expect: NONE,
  },
  {
    reason: 'consecutive declarations form one group',
    applies: (pair) => pair.prev.isDeclaration && pair.next.isDeclaration,
    expect: NONE,
  },
  {
    reason: 'a statement spanning several lines stands apart',
    applies: (pair) => pair.prev.isMultiline || pair.next.isMultiline,
    expect: BLANK,
  },
  { reason: 'a group of declarations ends here', applies: (pair) => pair.prev.isDeclaration, expect: BLANK },
];

/**
 * Enforces a fixed blank-line rhythm between statements and class members.
 * Pairs with `one-line-guard`, which decides whether a guard is one line in the first place.
 */
export default createRule<Options, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: 'layout',
    fixable: 'whitespace',
    docs: { description: 'Deterministic blank lines between statements and class members', preset: 'lite' },
    schema: [],
    messages: {
      blankRequired: guidance({
        problem: 'Missing blank line: {{reason}}.',
        why: 'A fixed rhythm of blank lines makes steps visible at a glance and keeps diffs free of spacing churn.',
        fix: 'Insert one blank line here (autofixable).',
      }),
      blankForbidden: guidance({
        problem: 'Unexpected blank line: {{reason}}.',
        why: 'A blank line splits code that belongs together, so the reader sees two steps where there is one.',
        fix: 'Remove the blank line (autofixable).',
      }),
    },
  },
  defaultOptions: [],

  create(context) {
    const checkList = (statements: readonly Statement[]): void => checkStatementList(context, statements);
    return {
      Program: (node) => checkList(node.body),
      BlockStatement: (node) => checkList(node.body),
      StaticBlock: (node) => checkList(node.body),
      SwitchCase: (node) => checkList(node.consequent),
      TSModuleBlock: (node) => checkList(node.body),
      ClassBody: (node) => checkClassBody(context, node.body),
    };
  },
});

function checkStatementList(context: Context, statements: readonly Statement[]): void {
  for (let index = 1; index < statements.length; index++) {
    const pair = describePair(context.sourceCode, statements, index);
    const rule = STATEMENT_RULES.find((candidate) => candidate.applies(pair));
    if (rule) {
      enforce(context, { prev: statements[index - 1]!, next: statements[index]!, rule });
    }
  }
}

function checkClassBody(context: Context, members: readonly ClassMember[]): void {
  for (let index = 1; index < members.length; index++) {
    const [prev, next] = [members[index - 1]!, members[index]!];
    enforce(context, { prev, next, rule: classMemberRule(prev, next) });
  }
}

function classMemberRule(prev: ClassMember, next: ClassMember): SpacingRule {
  if (isInjectedField(prev) !== isInjectedField(next)) {
    return { reason: 'injected dependencies form their own group', expect: BLANK };
  }

  if (isInjectedField(prev) && visibility(prev) !== visibility(next)) {
    return { reason: 'injected dependencies are grouped by visibility', expect: BLANK };
  }

  if (isMultiline(prev) || isMultiline(next)) {
    return { reason: 'methods and multi-line members stand apart', expect: BLANK };
  }

  return { reason: 'consecutive one-line members form one group', expect: NONE };
}

function describePair(sourceCode: SourceCode, statements: readonly Statement[], index: number): Pair {
  const prev = statements[index - 1]!;
  const next = statements[index]!;

  return {
    prev: describe(prev),
    next: describe(next),
    prevNode: unwrapExport(prev),
    nextNode: unwrapExport(next),
    sourceCode,
    isFinalReturn: next.type === 'ReturnStatement' && index === statements.length - 1,
    isShort: statements.length <= SHORT_BLOCK,
  };
}

function describe(statement: Statement): Shape {
  const node = unwrapExport(statement);
  const isGuard = node.type === 'IfStatement' && !node.alternate && !isMultiline(node);

  return {
    isImport: statement.type === 'ImportDeclaration' || ('source' in statement && Boolean(statement.source)),
    isExport:
      statement.type === 'ExportDefaultDeclaration' ||
      (statement.type === 'ExportNamedDeclaration' && !statement.source),
    isGuard,
    isBlockLike: BLOCK_LIKE.has(node.type) && !isGuard,
    isDeclaration: node.type === 'VariableDeclaration',
    isMultiline: isMultiline(statement),
  };
}

function unwrapExport(statement: Statement): TSESTree.Node {
  if (statement.type === 'ExportNamedDeclaration' && statement.declaration) return statement.declaration;

  return statement;
}

function isMultiline(node: TSESTree.Node): boolean {
  return node.loc.start.line !== node.loc.end.line;
}

function declarationConsumed({ prevNode, nextNode, sourceCode }: Pair): boolean {
  if (prevNode.type !== 'VariableDeclaration') return false;

  const header = readingNodes(nextNode);

  return sourceCode
    .getDeclaredVariables(prevNode)
    .some((variable) =>
      variable.references.some((reference) => header.some((part) => contains(part, reference.identifier))),
    );
}

/** A block statement only counts as reading a variable in its header, any other statement as a whole. */
function readingNodes(node: TSESTree.Node): TSESTree.Node[] {
  if (node.type === 'IfStatement' || node.type === 'WhileStatement') return [node.test];
  if (node.type === 'SwitchStatement') return [node.discriminant];
  if (node.type === 'ForStatement') return [node.init, node.test, node.update].filter(isPresent);
  if (node.type === 'ForInStatement' || node.type === 'ForOfStatement') return [node.left, node.right];
  if (BLOCK_LIKE.has(node.type)) return [];

  return [node];
}

function isPresent<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

function contains(outer: TSESTree.Node, inner: TSESTree.Node): boolean {
  return inner.range[0] >= outer.range[0] && inner.range[1] <= outer.range[1];
}

function enforce(context: Context, { prev, next, rule }: { prev: Spaced; next: Spaced; rule: SpacingRule }): void {
  const sourceCode = context.sourceCode;
  const gap = measureGap(sourceCode, prev, next);
  const data = { reason: rule.reason };

  if (rule.expect === BLANK && !gap.hasBlankLine) {
    context.report({
      loc: gap.end.loc,
      messageId: 'blankRequired',
      data,
      fix: (fixer) => fixer.insertTextAfterRange(gap.end.range, '\n'),
    });
  }

  if (rule.expect === NONE && gap.hasBlankLine) {
    const lineStart = sourceCode.getIndexFromLoc({ line: gap.start.loc.start.line, column: 0 });
    const range: TSESTree.Range = [gap.end.range[1], lineStart];
    context.report({
      loc: gap.start.loc,
      messageId: 'blankForbidden',
      data,
      fix: (fixer) => fixer.replaceTextRange(range, '\n'),
    });
  }
}

/**
 * The gap runs from the end of `prev` (including a comment trailing on its last line) to the first comment
 * or token of `next`, so a comment above a statement moves together with it.
 */
function measureGap(
  sourceCode: SourceCode,
  prev: Spaced,
  next: Spaced,
): { end: TSESTree.Token; start: TSESTree.Token; hasBlankLine: boolean } {
  const prevLast = sourceCode.getLastToken(prev)!;
  const trailing = sourceCode
    .getCommentsAfter(prevLast)
    .filter((comment) => comment.loc.start.line === prevLast.loc.end.line);
  const end: TSESTree.Token = trailing.at(-1) ?? prevLast;
  const nextFirst = sourceCode.getFirstToken(next)!;
  const leading = sourceCode
    .getCommentsBefore(nextFirst)
    .filter((comment) => comment.loc.start.line > end.loc.end.line);
  const start: TSESTree.Token = leading[0] ?? nextFirst;

  return { end, start, hasBlankLine: start.loc.start.line - end.loc.end.line > 1 };
}

export const RULE_DOCS_EXTENSION = {
  rationale:
    'A fixed rhythm of blank lines makes the steps of a function visible at a glance and keeps diffs free of spacing churn. The blank line between two statements is decided from their shapes alone (imports, exports, guards, declarations and the statements that read them, blocks, multi-line statements, final returns), and class members are grouped the same way, so layout never depends on taste. Pairs no rule covers keep whatever the author wrote; `one-line-guard` decides whether a guard is one line in the first place.',
};
