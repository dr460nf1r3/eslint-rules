import type { TSESTree } from '@typescript-eslint/utils';
import type { ImportTracker } from '../utils/ast.js';
import { createImportTracker, decoratorName } from '../utils/ast.js';
import { createRule } from '../utils/create-rule.js';
import { guidance } from '../utils/message.js';

export type Options = [{ checkParams?: boolean }];

export type MessageIds = 'missingSchema' | 'useSchemaOption';

export const RULE_NAME = 'require-body-schema';

const NEST = '@nestjs/common';
const PARAM_DECORATORS = new Set(['Body', 'Param', 'Query']);
const PRIMITIVE_TYPES = new Set(['TSStringKeyword', 'TSNumberKeyword', 'TSBooleanKeyword']);
const SCHEMA_NAME = /Schema$/;

/**
 * Requires Nest request input to be validated through the decorator's Standard Schema option,
 * e.g. `@Body({ schema: createInvoiceSchema })`. The global `StandardSchemaValidationPipe` then applies it.
 * Per-parameter zod pipes are the pattern this replaces.
 */
export default createRule<Options, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: 'problem',
    docs: {
      description: 'Require `{ schema }` on @Body (and non-primitive @Param/@Query) parameters',
      frameworks: ['NestJS'],
    },
    schema: [
      {
        type: 'object',
        properties: {
          checkParams: {
            type: 'boolean',
            description: 'Also check `@Param` and `@Query` parameters whose type is not a primitive.',
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      missingSchema: guidance({
        problem: '@{{decorator}}() on "{{param}}" has no schema, so the request input reaches the handler unvalidated.',
        why: 'TypeScript types vanish at runtime; only a schema rejects malformed or malicious input before it hits the Service Layer or SQL.',
        fix: 'Define `{{schemaName}}` in `libs/<lib>/src/lib/<domain>/schemas/<name>.schema.ts`, derive the type with `z.infer`, and write `@{{decorator}}({ schema: {{schemaName}} }) {{param}}: ...`.',
      }),
      useSchemaOption: guidance({
        problem: '@{{decorator}}() validates "{{param}}" through a pipe instead of the schema option.',
        why: 'The repo validates with Nest’s native Standard Schema support; per-parameter zod pipes duplicate the global StandardSchemaValidationPipe.',
        fix: 'Replace the pipe with `@{{decorator}}({ schema: <schema> })` and make sure main.ts registers `new StandardSchemaValidationPipe()`.',
      }),
    },
  },
  defaultOptions: [{ checkParams: true }],

  create(context, [{ checkParams = true }]) {
    const imports = createImportTracker();
    return {
      ...imports.visitor,
      Decorator(node: TSESTree.Decorator) {
        const name = decoratorName(node);
        if (!name || !isNestParamDecorator(imports, name) || node.expression.type !== 'CallExpression') return;

        const param = node.parent;
        if (name !== 'Body' && (!checkParams || hasPrimitiveType(param))) return;

        const args = node.expression.arguments;
        if (args.some(isSchemaOption)) return;

        const paramLabel = bindingName(param);
        const data = { decorator: name, param: paramLabel, schemaName: `${paramLabel}Schema` };
        context.report({ node, messageId: args.some(isSchemaPipe) ? 'useSchemaOption' : 'missingSchema', data });
      },
    };
  },
});

function isNestParamDecorator(imports: ImportTracker, name: string): boolean {
  return PARAM_DECORATORS.has(name) && imports.sourceOf(name)?.source === NEST;
}

function isSchemaOption(arg: TSESTree.CallExpressionArgument): boolean {
  if (arg.type !== 'ObjectExpression') return false;

  return arg.properties.some(
    (property) => property.type === 'Property' && property.key.type === 'Identifier' && property.key.name === 'schema',
  );
}

function isSchemaPipe(arg: TSESTree.CallExpressionArgument): boolean {
  if (arg.type !== 'NewExpression') return false;

  const calleeName = arg.callee.type === 'Identifier' ? arg.callee.name : '';

  return (
    calleeName.startsWith('Zod') ||
    arg.arguments.some((inner) => inner.type === 'Identifier' && SCHEMA_NAME.test(inner.name))
  );
}

/** The parameter binding itself, unwrapping `private readonly x: T` parameter properties. */
function binding(param: TSESTree.Node): TSESTree.Node {
  return param.type === 'TSParameterProperty' ? param.parameter : param;
}

function hasPrimitiveType(param: TSESTree.Node): boolean {
  const node = binding(param);
  const annotation = 'typeAnnotation' in node ? node.typeAnnotation : undefined;
  if (annotation?.type !== 'TSTypeAnnotation') return true;

  return PRIMITIVE_TYPES.has(annotation.typeAnnotation.type);
}

function bindingName(param: TSESTree.Node): string {
  const node = binding(param);
  return node.type === 'Identifier' ? node.name : 'body';
}

export const RULE_DOCS_EXTENSION = {
  rationale:
    'TypeScript types vanish at runtime, so only a schema rejects malformed or malicious request input before it reaches the Service Layer or SQL. Nest validates the `{ schema }` option of `@Body`, `@Param` and `@Query` natively through the global `StandardSchemaValidationPipe`, which makes per-parameter zod pipes redundant. Primitive `@Param`/`@Query` values are skipped because Nest’s parse pipes already cover them.',
};
