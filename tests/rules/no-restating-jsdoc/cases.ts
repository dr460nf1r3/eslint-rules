import type { InvalidTestCase, ValidTestCase } from '@typescript-eslint/rule-tester';
import type { MessageIds, Options } from '../../../src/rules/no-restating-jsdoc.js';

export const valid: readonly ValidTestCase<Options>[] = [
  {
    name: 'accepts JSDoc that adds information',
    code: `/**
 * Loads the draft and falls back to the base document when no draft exists.
 * @param user The logged-in user whose company DB is queried.
 * @returns The parsed value, with the schema defaults applied.
 */
function getDraft(user) {}`,
  },
];

export const invalid: readonly InvalidTestCase<MessageIds, Options>[] = [
  {
    name: 'reports a description that only repeats the function name, also through synonyms',
    code: '/** Gets the invoice lines. */\nfunction getInvoiceLines() {}',
    errors: [{ messageId: 'restatesName', data: { name: 'getInvoiceLines' } }],
  },
  {
    name: 'reports a description that only repeats the function name, also through synonyms (2)',
    code: '/** Returns the invoice lines. */\nexport function getInvoiceLines() {}',
    errors: [{ messageId: 'restatesName', data: { name: 'getInvoiceLines' } }],
  },
  {
    name: 'reports restating descriptions on decorated methods and properties',
    code: 'class A {\n  /** Loads the user. */\n  @Trace\n  loadUser() {}\n  /** The page size. */\n  pageSize = 10;\n}',
    errors: [
      { messageId: 'restatesName', data: { name: 'loadUser' } },
      { messageId: 'restatesName', data: { name: 'pageSize' } },
    ],
  },
  {
    name: 'reports @param descriptions that repeat the parameter name',
    code: '/**\n * Prices one line with the customer discount rules B1 applies.\n * @param user The user.\n * @param lineNum The line number.\n */\nfunction price(user, lineNum) {}',
    errors: [
      { messageId: 'restatesParam', data: { param: 'user' } },
      { messageId: 'restatesParam', data: { param: 'lineNum' } },
    ],
  },
  {
    name: 'reports generic @returns descriptions',
    code: '/**\n * Sums net prices as B1 does, per line before the header discount.\n * @returns The result.\n */\nfunction total() {}',
    errors: [{ messageId: 'genericReturns', data: { text: 'The result.' } }],
  },
];
