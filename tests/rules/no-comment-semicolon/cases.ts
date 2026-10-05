import type { InvalidTestCase, ValidTestCase } from '@typescript-eslint/rule-tester';
import type { MessageIds, Options } from '../../../src/rules/no-comment-semicolon.js';

/** The cases contain `eslint-disable` comments on purpose, and RuleTester would report them as unused. */
const allowUnusedDirectives = { linterOptions: { reportUnusedDisableDirectives: 'off' } } as const;

export const valid: readonly ValidTestCase<Options>[] = [
  {
    name: 'ignores semicolons inside backtick code spans and HTML entities',
    code: '/** Call `load(); render();` in that order, separated by &nbsp; a space. */\nconst a = 1;',
  },
  {
    name: 'ignores @example blocks and fenced code',
    code: '/**\n * Builds the clause.\n * @example\n * const sql = build(); run(sql);\n */\nfunction build() {}\n/**\n * ```ts\n * a(); b();\n * ```\n */\nconst x = 1;',
  },
  {
    name: 'ignores directives and commented-out code',
    ...allowUnusedDirectives,
    code: '// eslint-disable-next-line no-console -- debug; temporary\nconsole.log(1);\n// const total = sum(lines);\nconst a = 1;',
  },
];

export const invalid: readonly InvalidTestCase<MessageIds, Options>[] = [
  {
    name: 'reports semicolons joining clauses in line comments',
    code: '// B1 rounds per line; the header total is derived\nconst a = 1;',
    errors: [{ messageId: 'semicolon' }],
  },
  {
    name: 'reports every semicolon in JSDoc prose',
    code: '/**\n * Loads the draft; falls back to the base document; never throws.\n */\nfunction load() {}',
    errors: [{ messageId: 'semicolon' }, { messageId: 'semicolon' }],
  },
  {
    name: 'points at the semicolon itself',
    code: 'const a = 1; // cached; refreshed hourly',
    errors: [{ messageId: 'semicolon', line: 1, column: 23, endLine: 1, endColumn: 24 }],
  },
];
