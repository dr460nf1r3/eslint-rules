import type { TSESTree } from '@typescript-eslint/utils';
import { readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { createRule } from '../utils/create-rule.js';
import { guidance } from '../utils/message.js';

export type Options = [];

export type MessageIds = 'missingPipe';

export const RULE_NAME = 'require-standard-schema-pipe';

const PIPE = 'StandardSchemaValidationPipe';
const RELATIVE_IMPORT = /from\s+['"](\.{1,2}\/[^'"]+)['"]/g;
const EXTENSIONS = ['', '.ts', '.mts', '.js', '/index.ts'];
/** Upper bound on module files read per bootstrap, so a large app cannot stall linting. */
const MAX_FILES = 200;

/**
 * A `@Body({ schema })` option does nothing unless the app registers `StandardSchemaValidationPipe`
 * globally: either `app.useGlobalPipes(new StandardSchemaValidationPipe())` in the bootstrap, or an
 * `APP_PIPE` provider in the root module or a module it imports through relative paths.
 */
export default createRule<Options, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: 'problem',
    docs: {
      description: 'Require the global StandardSchemaValidationPipe in Nest bootstraps',
      frameworks: ['NestJS'],
    },
    schema: [],
    messages: {
      missingPipe: guidance({
        problem: 'This Nest bootstrap does not register `StandardSchemaValidationPipe`.',
        why: 'Without it, `@Body({ schema })` options are silently ignored and requests are not validated.',
        fix: 'Add `app.useGlobalPipes(new StandardSchemaValidationPipe());` after creating the app, or provide it in the root module: `{ provide: APP_PIPE, useValue: new StandardSchemaValidationPipe() }`.',
      }),
    },
  },
  defaultOptions: [],

  create(context) {
    let bootstrap: TSESTree.CallExpression | undefined;
    let hasPipe = false;
    return {
      'CallExpression[callee.object.name="NestFactory"][callee.property.name="create"]'(node: TSESTree.CallExpression) {
        bootstrap ??= node;
      },
      [`NewExpression[callee.name="${PIPE}"]`]() {
        hasPipe = true;
      },
      'Program:exit'() {
        if (!bootstrap || hasPipe || modulesProvidePipe(bootstrap, context.sourceCode.ast, context.filename)) return;

        context.report({ node: bootstrap, messageId: 'missingPipe' });
      },
    };
  },
});

/** Whether the module passed to `NestFactory.create`, or a module it imports, has an `APP_PIPE` provider for the pipe. */
function modulesProvidePipe(bootstrap: TSESTree.CallExpression, program: TSESTree.Program, filename: string): boolean {
  const [rootModule] = bootstrap.arguments;
  if (rootModule?.type !== 'Identifier') return false;

  const source = importSourceOf(program, rootModule.name);
  if (!source?.startsWith('.')) return false;

  const queue = [resolveModule(path.dirname(filename), source)];
  const seen = new Set<string>();
  while (queue.length > 0 && seen.size < MAX_FILES) {
    const file = queue.shift();
    if (!file || seen.has(file)) continue;

    seen.add(file);
    const text = readFileSync(file, 'utf8');
    if (text.includes('APP_PIPE') && text.includes(PIPE)) return true;

    for (const [, specifier] of text.matchAll(RELATIVE_IMPORT)) {
      queue.push(resolveModule(path.dirname(file), specifier!));
    }
  }

  return false;
}

function importSourceOf(program: TSESTree.Program, localName: string): string | undefined {
  const declaration = program.body.find(
    (statement): statement is TSESTree.ImportDeclaration =>
      statement.type === 'ImportDeclaration' &&
      statement.specifiers.some((specifier) => specifier.local.name === localName),
  );
  return declaration?.source.value;
}

/** Resolves a relative import to a file on disk, with the extensions TypeScript projects use. */
function resolveModule(directory: string, specifier: string): string | undefined {
  const base = path.resolve(directory, specifier.replace(/\.js$/, ''));
  return EXTENSIONS.map((extension) => base + extension).find(isFile);
}

function isFile(candidate: string): boolean {
  return statSync(candidate, { throwIfNoEntry: false })?.isFile() ?? false;
}

export const RULE_DOCS_EXTENSION = {
  rationale:
    'A `@Body({ schema })` option does nothing unless the app registers `StandardSchemaValidationPipe` globally; without it, request validation is silently skipped. Every file that calls `NestFactory.create` must therefore construct the pipe, or pass a root module that provides it as `APP_PIPE` (directly or through modules it imports by relative path; path aliases are not followed).',
};
