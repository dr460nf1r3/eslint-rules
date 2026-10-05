import type { InvalidTestCase, ValidTestCase } from '@typescript-eslint/rule-tester';
import type { MessageIds, Options } from '../../../src/rules/no-stray-semicolon.js';

export const valid: readonly ValidTestCase<Options>[] = [
  {
    name: 'accepts ordinary statement terminators and for(;;) headers',
    code: `const a = 1;\nfor (let i = 0; i < 3; i++) {}\nfor (;;) { break; }\nclass A { x = 1; m() {} }`,
  },
];

export const invalid: readonly InvalidTestCase<MessageIds, Options>[] = [
  {
    name: 'reports and removes doubled semicolons',
    code: 'const a = 1;;',
    output: 'const a = 1;',
    errors: [{ messageId: 'straySemicolon' }],
  },
  {
    name: 'reports and removes semicolons after function and class declarations',
    code: 'function f() {};\nclass B {};',
    output: 'function f() {}\nclass B {}',
    errors: [{ messageId: 'straySemicolon' }, { messageId: 'straySemicolon' }],
  },
  {
    name: 'reports and removes stray semicolons inside class bodies',
    code: 'class A { x = 1;; m() {}; }',
    output: 'class A { x = 1; m() {} }',
    errors: [{ messageId: 'straySemicolon' }, { messageId: 'straySemicolon' }],
  },
  {
    name: 'reports an empty if/loop body without fixing it, since it is usually a bug',
    code: 'if (ready);\nwhile (next());',
    output: null,
    errors: [
      { messageId: 'emptyBody', data: { keyword: 'if' } },
      { messageId: 'emptyBody', data: { keyword: 'while' } },
    ],
  },
];
