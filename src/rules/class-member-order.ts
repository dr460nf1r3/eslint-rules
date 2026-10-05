import type { TSESLint, TSESTree } from '@typescript-eslint/utils';
import { memberGroup, memberName, memberRank } from '../utils/class-members.js';
import type { ClassMember } from '../utils/class-members.js';
import { createRule } from '../utils/create-rule.js';
import { guidance } from '../utils/message.js';

export type Options = [];

export type MessageIds = 'outOfOrder';

export const RULE_NAME = 'class-member-order';

type SourceCode = Readonly<TSESLint.SourceCode>;

interface RankedMember {
  member: ClassMember;
  index: number;
  rank: [number, number];
}

const FUNCTION_SCOPES: ReadonlySet<string> = new Set([
  'FunctionExpression',
  'ArrowFunctionExpression',
  'ClassExpression',
]);

/**
 * Gives every class one member order: statics, `inject()` fields by visibility, inputs/outputs, view and
 * content queries, `signal()`, derived signals and resources, other fields, constructor, lifecycle hooks in
 * framework order, then methods by visibility. Members of the same rank keep their source order, so Nest
 * routes keep their registration order and overloads stay together.
 */
export default createRule<Options, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: 'layout',
    fixable: 'code',
    docs: { description: 'One fixed order for class members', preset: 'lite', frameworks: ['Angular', 'NestJS'] },
    schema: [],
    messages: {
      outOfOrder: guidance({
        problem: '`{{name}}` ({{group}}) belongs before `{{other}}` ({{otherGroup}}).',
        why: 'With one order, every class reads the same way: dependencies, then inputs, state, setup and finally behaviour.',
        fix: 'Move the member (autofixable unless a field initialiser reads a field that would move below it).',
      }),
    },
  },
  defaultOptions: [],

  create(context) {
    const sourceCode = context.sourceCode;
    return {
      ClassBody(node) {
        const members = node.body;
        const sorted = members
          .map((member, index): RankedMember => ({ member, index, rank: memberRank(member) }))
          .sort(compareRanks)
          .map((entry) => entry.member);
        const misplaced = members.findIndex((member, index) => member !== sorted[index]);
        if (misplaced === -1) return;

        const member = sorted[misplaced]!;
        const other = members[misplaced]!;
        context.report({
          node: member,
          messageId: 'outOfOrder',
          data: {
            name: memberName(member),
            group: memberGroup(member),
            other: memberName(other),
            otherGroup: memberGroup(other),
          },
          fix: isSafeOrder(sorted) ? (fixer) => reorder(fixer, sourceCode, { members, sorted }) : null,
        });
      },
    };
  },
});

function compareRanks(a: RankedMember, b: RankedMember): number {
  return a.rank[0] - b.rank[0] || a.rank[1] - b.rank[1] || a.index - b.index;
}

/** Field initialisers run in source order, so a field may only read fields that stay above it. */
function isSafeOrder(sorted: readonly ClassMember[]): boolean {
  const fields = sorted.filter(isField);
  const position = new Map(fields.map((member, index) => [memberName(member), index]));
  return fields.every((field, index) =>
    eagerThisReads(field.value).every((name) => (position.get(name) ?? -1) < index),
  );
}

function isField(member: ClassMember): member is TSESTree.PropertyDefinition {
  return member.type === 'PropertyDefinition' && !member.static;
}

function isNode(value: unknown): value is TSESTree.Node {
  return typeof value === 'object' && value !== null && 'type' in value && typeof value.type === 'string';
}

/** Names read through `this.name` while the initialiser runs, skipping nested functions and classes. */
function eagerThisReads(node: TSESTree.Node | null, names: string[] = []): string[] {
  if (!node || FUNCTION_SCOPES.has(node.type)) return names;

  if (node.type === 'MemberExpression' && node.object.type === 'ThisExpression' && !node.computed) {
    names.push(node.property.name);
  }

  for (const [key, value] of Object.entries(node)) {
    if (key === 'parent') continue;

    for (const child of [value as unknown].flat()) {
      if (isNode(child)) {
        eagerThisReads(child, names);
      }
    }
  }

  return names;
}

/** Moves each member together with its leading comments and a comment trailing on its last line. */
function reorder(
  fixer: TSESLint.RuleFixer,
  sourceCode: SourceCode,
  { members, sorted }: { members: readonly ClassMember[]; sorted: readonly ClassMember[] },
): TSESLint.RuleFix {
  const chunks = new Map(members.map((member) => [member, chunkRange(sourceCode, member)]));
  const first = chunks.get(members[0]!)!;
  const last = chunks.get(members.at(-1)!)!;
  const indent = ' '.repeat(sourceCode.getLocFromIndex(first[0]).column);
  const text = sorted.map((member) => sourceCode.text.slice(...chunks.get(member)!)).join(`\n${indent}`);
  return fixer.replaceTextRange([first[0], last[1]], text);
}

function chunkRange(sourceCode: SourceCode, member: ClassMember): TSESTree.Range {
  const firstToken = sourceCode.getFirstToken(member)!;
  const lastToken = sourceCode.getLastToken(member)!;
  const previous = sourceCode.getTokenBefore(firstToken)!;
  const leading = sourceCode
    .getCommentsBefore(firstToken)
    .filter((comment) => comment.loc.start.line > previous.loc.end.line);
  const trailing = sourceCode
    .getCommentsAfter(lastToken)
    .filter((comment) => comment.loc.start.line === lastToken.loc.end.line);
  return [(leading[0] ?? firstToken).range[0], (trailing.at(-1) ?? lastToken).range[1]];
}

export const RULE_DOCS_EXTENSION = {
  rationale:
    'With one order, every class reads the same way: dependencies, then inputs, state, setup and finally behaviour. Statics come first, then `inject()` fields by visibility, inputs and outputs, queries, signals, derived signals, other fields, the constructor, lifecycle hooks in framework order and methods by visibility. Members of the same rank keep their source order, so Nest routes keep their registration order and overloads stay together, and the autofix is skipped when a field initialiser would read a field moved below it.',
};
