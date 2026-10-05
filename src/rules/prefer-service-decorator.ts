import type { TSESLint, TSESTree } from '@typescript-eslint/utils';
import { createImportTracker, decoratorName } from '../utils/ast.js';
import { createRule } from '../utils/create-rule.js';
import { guidance } from '../utils/message.js';

export type Options = [];

export type MessageIds = 'useService';

export const RULE_NAME = 'prefer-service-decorator';

const ANGULAR_CORE = '@angular/core';

/**
 * Angular 22's `@Service()` is the shorthand for `@Injectable({ providedIn: 'root' })`. Bare
 * `@Injectable()` and root-provided Angular services are converted. Providers with other options
 * (`providedIn: 'platform'`, factories) stay `@Injectable`. Nest's `@Injectable` is never touched.
 */
export default createRule<Options, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    fixable: 'code',
    docs: {
      description: 'Use @Service() instead of @Injectable() for Angular root services',
      preset: 'recommended',
      frameworks: ['Angular'],
    },
    schema: [],
    messages: {
      useService: guidance({
        problem: 'Angular service uses `@Injectable(...)` instead of `@Service()`.',
        why: 'The repo standard is the Angular 22 `@Service()` shorthand; mixing both styles hides which services are root singletons.',
        fix: 'Replace the decorator with `@Service()` and import `Service` from `@angular/core` (autofixable).',
      }),
    },
  },
  defaultOptions: [],

  create(context) {
    const imports = createImportTracker();
    const angularInjectables: TSESTree.Decorator[] = [];
    return {
      ...imports.visitor,
      'Decorator'(node) {
        const entry = imports.sourceOf(decoratorName(node) ?? '');
        if (entry?.source === ANGULAR_CORE && entry.importedName === 'Injectable') {
          angularInjectables.push(node);
        }
      },
      'Program:exit'(program: TSESTree.Program) {
        const convertible = angularInjectables.filter(isRootInjectable);
        const keepInjectable = convertible.length < angularInjectables.length;
        const importDeclaration = program.body.find(
          (statement): statement is TSESTree.ImportDeclaration =>
            statement.type === 'ImportDeclaration' && statement.source.value === ANGULAR_CORE,
        );
        for (const decorator of convertible) {
          context.report({
            node: decorator,
            messageId: 'useService',
            fix: (fixer) => [
              fixer.replaceText(decorator.expression, 'Service()'),
              ...rewriteImport(fixer, {
                sourceCode: context.sourceCode,
                declaration: importDeclaration,
                keepInjectable,
              }),
            ],
          });
        }
      },
    };
  },
});

function isRootInjectable(decorator: TSESTree.Decorator): boolean {
  const args = decorator.expression.type === 'CallExpression' ? decorator.expression.arguments : [];
  if (args.length === 0) return true;

  const [options] = args;
  if (args.length !== 1 || options?.type !== 'ObjectExpression' || options.properties.length !== 1) return false;

  const [property] = options.properties;
  return (
    property?.type === 'Property' &&
    property.key.type === 'Identifier' &&
    property.key.name === 'providedIn' &&
    property.value.type === 'Literal' &&
    property.value.value === 'root'
  );
}

interface ImportRewrite {
  sourceCode: Readonly<TSESLint.SourceCode>;
  declaration: TSESTree.ImportDeclaration | undefined;
  keepInjectable: boolean;
}

function rewriteImport(
  fixer: TSESLint.RuleFixer,
  { sourceCode, declaration, keepInjectable }: ImportRewrite,
): TSESLint.RuleFix[] {
  const specifiers = (declaration?.specifiers ?? []).filter(
    (specifier): specifier is TSESTree.ImportSpecifier => specifier.type === 'ImportSpecifier',
  );
  const first = specifiers[0];
  const last = specifiers.at(-1);
  if (!first || !last) return [];

  const names = specifiers.map((specifier) => sourceCode.getText(specifier));
  const hasService = names.includes('Service');
  const rewritten = names.flatMap((name) => {
    if (name !== 'Injectable' || keepInjectable) return [name];

    return hasService ? [] : ['Service'];
  });
  if (keepInjectable && !hasService) {
    rewritten.push('Service');
  }

  return [fixer.replaceTextRange([first.range[0], last.range[1]], rewritten.join(', '))];
}

export const RULE_DOCS_EXTENSION = {
  rationale:
    "Angular 22's `@Service()` is the shorthand for `@Injectable({ providedIn: 'root' })`, and mixing both styles hides which services are root singletons. Bare and root-provided Angular `@Injectable`s are converted automatically; providers with other options and Nest's `@Injectable` are left alone.",
};
