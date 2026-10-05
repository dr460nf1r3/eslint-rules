import type { TSESLint, TSESTree } from '@typescript-eslint/utils';
import path from 'node:path';
import { decoratorName } from '../utils/ast.js';
import { createRule } from '../utils/create-rule.js';
import { guidance } from '../utils/message.js';

export type Options = [{ ignore?: string[] }];

export type MessageIds = 'wrongSuffix' | 'notKebabCase';

export const RULE_NAME = 'file-suffix';

const DECORATOR_SUFFIX: ReadonlyMap<string, string> = new Map([
  ['Component', 'component'],
  ['Controller', 'controller'],
  ['Module', 'module'],
  ['Directive', 'directive'],
  ['Pipe', 'pipe'],
]);
const SERVICE_DECORATORS: ReadonlySet<string> = new Set(['Injectable', 'Service']);
const KEBAB_CASE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
/** Migration tools name files `<timestamp>-<Name>.ts` (TypeORM) or `<timestamp>_<name>.ts` (Knex, MikroORM). */
const MIGRATION = /^\d{8,}[-_]/;
const GENERATED_MARKER = /@generated|auto-?generated|do not edit/i;
const ROUTES_DECLARATOR = 'VariableDeclarator[id.typeAnnotation.typeAnnotation.typeName.name="Routes"]';

/**
 * File names follow the Angular/Nest style guide: kebab-case, with a role suffix that matches what
 * the file declares (`.component.ts`, `.controller.ts`, `.service.ts`, `.routes.ts`, ...).
 */
export default createRule<Options, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Require kebab-case file names with a suffix matching the declared role',
      preset: 'recommended',
      frameworks: ['Angular', 'NestJS'],
    },
    schema: [
      {
        type: 'object',
        properties: {
          ignore: {
            type: 'array',
            items: { type: 'string' },
            description:
              'Regular expressions matched against the file path (forward slashes); matching files are skipped.',
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      wrongSuffix: guidance({
        problem: '"{{name}}" is a {{role}} but the file "{{file}}" does not end in `.{{role}}.ts`.',
        why: 'Role suffixes make files findable by type and keep one role per file.',
        fix: 'Rename the file to `{{stem}}.{{role}}.ts` and update its imports.',
      }),
      notKebabCase: guidance({
        problem: 'File name "{{file}}" is not kebab-case.',
        why: 'Mixed casing breaks on case-insensitive file systems and makes files hard to find.',
        fix: 'Rename it to `{{kebab}}` and update its imports.',
      }),
    },
  },
  defaultOptions: [{ ignore: [] }],

  create(context, [{ ignore = [] }]) {
    const file = path.basename(context.filename);
    const stem = file.split('.')[0] ?? '';

    if (isExempt(context.filename, headerComments(context.sourceCode), ignore)) return {};

    function requireSuffix(node: TSESTree.Node, name: string, role: string): void {
      if (file.endsWith(`.${role}.ts`)) return;

      context.report({ node, messageId: 'wrongSuffix', data: { name, role, file, stem: toKebab(stem) } });
    }

    return {
      Program() {
        if (stem === 'index' || KEBAB_CASE.test(stem)) return;

        const kebab = file.replace(stem, toKebab(stem));
        context.report({ loc: { line: 1, column: 0 }, messageId: 'notKebabCase', data: { file, kebab } });
      },
      ClassDeclaration(node) {
        const role = classRole(node);
        if (role) {
          requireSuffix(node.id ?? node, node.id?.name ?? 'class', role);
        }
      },
      [ROUTES_DECLARATOR](node: TSESTree.VariableDeclarator) {
        if (node.id.type === 'Identifier') {
          requireSuffix(node.id, node.id.name, 'routes');
        }
      },
    };
  },
});

/** Migrations and generated files keep the names their tools give them. */
function isExempt(filename: string, header: TSESTree.Comment[], ignore: string[]): boolean {
  const posixPath = filename.split(path.sep).join('/');

  if (MIGRATION.test(path.basename(filename))) return true;
  if (header.some((comment) => GENERATED_MARKER.test(comment.value))) return true;

  return ignore.some((pattern) => new RegExp(pattern).test(posixPath));
}

/** Comments before the first token, where code generators put their banner. */
function headerComments(sourceCode: Readonly<TSESLint.SourceCode>): TSESTree.Comment[] {
  const first = sourceCode.ast.tokens[0];
  return sourceCode.getAllComments().filter((comment) => !first || comment.range[1] <= first.range[0]);
}

function classRole(classNode: TSESTree.ClassDeclaration): string | undefined {
  for (const decorator of classNode.decorators) {
    const name = decoratorName(decorator) ?? '';
    const suffix = DECORATOR_SUFFIX.get(name);
    if (suffix) return suffix;
    if (SERVICE_DECORATORS.has(name) && classNode.id?.name.endsWith('Service')) return 'service';
  }

  const implementsPipe = classNode.implements.some(
    (clause) => clause.expression.type === 'Identifier' && clause.expression.name === 'PipeTransform',
  );
  return implementsPipe ? 'pipe' : undefined;
}

function toKebab(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[_\s]+/g, '-')
    .toLowerCase();
}

export const RULE_DOCS_EXTENSION = {
  rationale:
    'File names follow the Angular and Nest style guides: kebab-case, with a role suffix (`.component.ts`, `.controller.ts`, `.service.ts`, `.routes.ts`, ...) that matches what the file declares. Role suffixes make files findable by type and keep one role per file, and kebab-case avoids surprises on case-insensitive file systems. Timestamped migrations (`1700000000000-AddUsers.ts`), files whose header comments mark them as generated (`@generated`, `auto-generated`, `do not edit`) and paths matching the `ignore` option are skipped.',
};
