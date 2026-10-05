import type { TSESLint, TSESTree } from '@typescript-eslint/utils';
import { commentLines, isJsDoc } from '../utils/comments.js';
import { createRule } from '../utils/create-rule.js';
import { guidance } from '../utils/message.js';
import { identifierWords, proseWords, WHY_WORDS } from '../utils/words.js';

export type Options = [];

export type MessageIds = 'restatesName' | 'restatesParam' | 'genericReturns';

export const RULE_NAME = 'no-restating-jsdoc';

type Context = Readonly<TSESLint.RuleContext<MessageIds, Options>>;
type SourceCode = Readonly<TSESLint.SourceCode>;
type Tag = { kind: 'param'; name: string; text: string } | { kind: 'returns'; text: string };

const GENERIC: ReadonlySet<string> = new Set([
  'method',
  'function',
  'class',
  'service',
  'component',
  'helper',
  'value',
  'instance',
  'object',
  'property',
  'field',
  'variable',
  'constant',
  'handler',
  'data',
  'info',
  'information',
  'list',
  'parameter',
  'argument',
]);
const GENERIC_RETURNS: ReadonlySet<string> = new Set([
  'result',
  'value',
  'returned',
  'data',
  'response',
  'output',
  'promise',
  'object',
  'nothing',
  'void',
  'true',
  'false',
  'boolean',
  'string',
  'number',
  'array',
  'list',
  'get',
]);
const PARAM_TAG = /^@param\s+(?:\{[^}]*\}\s+)?\[?([\w$.]+)[^\s]*\s*(?:-\s*)?(.*)$/;
const RETURNS_TAG = /^@returns?\s+(?:\{[^}]*\}\s+)?(.*)$/;

/**
 * Flags JSDoc that only repeats what the signature says: a description made of the name's own words
 * ("Gets the invoice lines." on `getInvoiceLines`), `@param user The user.`, `@returns The result.`.
 */
export default createRule<Options, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow JSDoc that restates the documented name, parameters or return',
      preset: 'recommended',
    },
    schema: [],
    messages: {
      restatesName: guidance({
        problem: 'The JSDoc description of "{{name}}" only repeats its name.',
        why: 'A doc comment that restates the signature costs reading time and adds nothing a reader or IDE does not already show.',
        fix: 'Delete the description, or replace it with what the name cannot say: preconditions, side effects, units, the business rule behind it.',
      }),
      restatesParam: guidance({
        problem: '`@param {{param}}` only repeats the parameter name.',
        why: 'The name and type already say this.',
        fix: 'Delete the tag, or say what is not obvious: allowed values, units, where it comes from, what happens when it is empty.',
      }),
      genericReturns: guidance({
        problem: '`@returns {{text}}` says nothing about the result.',
        why: 'The return type already says this.',
        fix: 'Delete the tag, or describe the result: its shape, ordering, units, or when it is empty or undefined.',
      }),
    },
  },
  defaultOptions: [],

  create(context) {
    const sourceCode = context.sourceCode;
    function check(node: TSESTree.Node, name: string | undefined): void {
      const comment = jsDocBefore(sourceCode, node);
      if (!comment || !name) return;

      const { description, tags } = parseJsDoc(comment);
      const nameWords = new Set(identifierWords(name));
      if (onlyKnownWords(description, nameWords, GENERIC)) {
        context.report({ loc: comment.loc, messageId: 'restatesName', data: { name } });
      }

      for (const tag of tags) {
        reportTag(context, { comment, tag, nameWords });
      }
    }

    return {
      'FunctionDeclaration': (node) => check(node, node.id?.name),
      'MethodDefinition': (node) => check(node, keyName(node.key)),
      'PropertyDefinition': (node) => check(node, keyName(node.key)),
      'TSPropertySignature': (node) => check(node, keyName(node.key)),
      'TSMethodSignature': (node) => check(node, keyName(node.key)),
      'ClassDeclaration': (node) => check(node, node.id?.name),
      'Program > VariableDeclaration, ExportNamedDeclaration > VariableDeclaration': (
        node: TSESTree.VariableDeclaration,
      ) => check(node, keyName(node.declarations[0]?.id)),
    };
  },
});

/** Mirrors the legacy `node.key.name` lookup: only identifiers and `#private` names have one. */
function keyName(key: TSESTree.Node | undefined): string | undefined {
  return key?.type === 'Identifier' || key?.type === 'PrivateIdentifier' ? key.name : undefined;
}

function reportTag(
  context: Context,
  { comment, tag, nameWords }: { comment: TSESTree.Comment; tag: Tag; nameWords: Set<string> },
): void {
  if (tag.kind === 'param') {
    if (tag.text && onlyKnownWords(tag.text, new Set(identifierWords(tag.name)), GENERIC)) {
      context.report({ loc: comment.loc, messageId: 'restatesParam', data: { param: tag.name } });
    }

    return;
  }

  if (tag.text && onlyKnownWords(tag.text, nameWords, GENERIC_RETURNS)) {
    context.report({ loc: comment.loc, messageId: 'genericReturns', data: { text: tag.text } });
  }
}

function onlyKnownWords(text: string, known: ReadonlySet<string>, generic: ReadonlySet<string>): boolean {
  if (!text || WHY_WORDS.test(text)) return false;

  const words = proseWords(text);
  return words.length > 0 && words.every((word) => known.has(word) || generic.has(word));
}

function jsDocBefore(sourceCode: SourceCode, node: TSESTree.Node): TSESTree.Comment | undefined {
  const parentType = node.parent?.type;
  const isExported = parentType === 'ExportNamedDeclaration' || parentType === 'ExportDefaultDeclaration';
  const anchor = isExported && node.parent ? node.parent : node;
  const decorators: readonly TSESTree.Node[] = 'decorators' in node ? node.decorators : [];
  const start = [anchor, ...decorators].reduce((first, candidate) =>
    candidate.range[0] < first.range[0] ? candidate : first,
  );
  const firstToken = sourceCode.getFirstToken(start);
  const comment = firstToken ? sourceCode.getCommentsBefore(firstToken).at(-1) : undefined;
  return comment && isJsDoc(comment) ? comment : undefined;
}

function parseJsDoc(comment: TSESTree.Comment): { description: string; tags: Tag[] } {
  const lines = commentLines(comment);
  const firstTag = lines.findIndex((line) => line.startsWith('@'));
  const descriptionLines = firstTag === -1 ? lines : lines.slice(0, firstTag);
  const tags = (firstTag === -1 ? [] : lines.slice(firstTag)).flatMap(parseTag);
  return { description: descriptionLines.join(' ').trim(), tags };
}

function parseTag(line: string): Tag[] {
  const param = PARAM_TAG.exec(line);
  if (param) return [{ kind: 'param', name: param[1]!.split('.').at(-1)!, text: param[2]!.trim() }];

  const returns = RETURNS_TAG.exec(line);
  return returns ? [{ kind: 'returns', text: returns[1]!.trim() }] : [];
}

export const RULE_DOCS_EXTENSION = {
  rationale:
    'A doc comment that restates the signature costs reading time and adds nothing a reader or IDE does not already show. The rule flags descriptions made only of the name\'s own words ("Gets the invoice lines." on `getInvoiceLines`), `@param user The user.` and `@returns The result.`, matching verbs as concepts so synonyms count. Descriptions that give a reason are kept.',
};
