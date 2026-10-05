import type { InvalidTestCase, ValidTestCase } from '@typescript-eslint/rule-tester';
import type { MessageIds, Options } from '../../../src/rules/no-restating-comment.js';

/** The cases contain `eslint-disable` comments on purpose, and RuleTester would report them as unused. */
const allowUnusedDirectives = { linterOptions: { reportUnusedDisableDirectives: 'off' } } as const;
const RESTATING = [
  '// Set loading to true\nthis.loading.set(true);',
  '// Get the user from the session\nconst user = session.user;',
  '// Loop over all lines\nfor (const line of lines) {}',
  '// Check if the user is an admin\nif (user.isAdmin) {}',
  '/* Return the total */\nreturn total;',
];

export const valid: readonly ValidTestCase<Options>[] = [
  {
    name: 'accepts comments that explain why or add information',
    code: `function f() {
  // B1 recalculates the gross price after a PATCH
  const price = line.price;
  // Set to Y, otherwise SAP ignores the line
  this.flag.set('Y');
  // Dunning level 3 blocks deliveries in the customer's B1 setup
  if (partner.dunningLevel > 2) {}
}`,
  },
  {
    name: 'ignores JSDoc, directives and commented-out code',
    ...allowUnusedDirectives,
    code: '/** Gets the user. */\nfunction getUser() {}\n// eslint-disable-next-line\nconst user = 1;\n// const user = load();\nconst a = 1;',
  },
];

export const invalid: readonly InvalidTestCase<MessageIds, Options>[] = [
  ...RESTATING.map((code): InvalidTestCase<MessageIds, Options> => ({
    name: `reports ${JSON.stringify(code)}`,
    code: `function f() {\n${code}\n}`,
    errors: [{ messageId: 'restates' }],
  })),
  {
    name: 'reports a trailing comment that restates its line',
    code: 'let count = 1;\ncount = 0; // reset count',
    errors: [{ messageId: 'restates', data: { text: 'reset count' } }],
  },
];
