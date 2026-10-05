import type { TSESTree } from '@typescript-eslint/utils';
import { createRule } from '../utils/create-rule.js';
import { guidance } from '../utils/message.js';

export type Options = [];

export type MessageIds = 'missingPipe';

export const RULE_NAME = 'require-standard-schema-pipe';

/**
 * A `@Body({ schema })` option does nothing unless the app registers `StandardSchemaValidationPipe`
 * globally, so every Nest bootstrap file must do so.
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
        fix: 'Add `app.useGlobalPipes(new StandardSchemaValidationPipe());` after creating the app.',
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
      'NewExpression[callee.name="StandardSchemaValidationPipe"]'() {
        hasPipe = true;
      },
      'Program:exit'() {
        if (bootstrap && !hasPipe) {
          context.report({ node: bootstrap, messageId: 'missingPipe' });
        }
      },
    };
  },
});

export const RULE_DOCS_EXTENSION = {
  rationale:
    'A `@Body({ schema })` option does nothing unless the app registers `StandardSchemaValidationPipe` globally; without it, request validation is silently skipped. Every file that calls `NestFactory.create` must therefore also construct the pipe.',
};
