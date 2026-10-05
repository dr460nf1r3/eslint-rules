import type { InvalidTestCase, ValidTestCase } from '@typescript-eslint/rule-tester';
import type { MessageIds, Options } from '../../../src/rules/comment-style.js';

/** The cases contain `eslint-disable` comments on purpose, and RuleTester would report them as unused. */
const allowUnusedDirectives = { linterOptions: { reportUnusedDisableDirectives: 'off' } } as const;

export const valid: readonly ValidTestCase<Options>[] = [
  {
    name: 'accepts single // lines, JSDoc, directives and license headers',
    ...allowUnusedDirectives,
    code: `/*! (c) part */\n/* eslint-disable no-console */\n/** Doc. */\nconst a = 1; // trailing\n// single line\nconst b = 2;`,
  },
  {
    name: 'does not join // lines separated by code or directives',
    ...allowUnusedDirectives,
    code: `// one\nconst a = 1;\n// two\n// eslint-disable-next-line\nconst b = 2;`,
  },
];

export const invalid: readonly InvalidTestCase<MessageIds, Options>[] = [
  {
    name: 'turns a one-line block comment into //',
    code: `  /* Year */\n  const year = 2026;`,
    output: `  // Year\n  const year = 2026;`,
    errors: [{ messageId: 'blockComment' }],
  },
  {
    name: 'turns a multi-line block comment into JSDoc',
    code: `/*\n * B1 rounds per line,\n * not per document.\n */\nconst total = 1;`,
    output: `/**\n * B1 rounds per line,\n * not per document.\n */\nconst total = 1;`,
    errors: [{ messageId: 'blockComment' }],
  },
  {
    name: 'turns a run of // lines into one JSDoc block at the same indentation',
    code: `function f() {\n  // B1 returns the gross price here,\n  // so the net price is derived.\n  return 1;\n}`,
    output: `function f() {\n  /**\n   * B1 returns the gross price here,\n   * so the net price is derived.\n   */\n  return 1;\n}`,
    errors: [{ messageId: 'lineRun', data: { count: 2 } }],
  },
  {
    name: 'reports but does not fix an inline block comment between tokens',
    code: `call(1 /* Year */, 2);`,
    output: null,
    errors: [{ messageId: 'blockComment' }],
  },
];
