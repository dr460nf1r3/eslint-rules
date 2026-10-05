import type { InvalidTestCase, ValidTestCase } from '@typescript-eslint/rule-tester';
import type { MessageIds, Options } from '../../../src/rules/max-comment-lines.js';

const lines = (count: number): string[] => Array.from({ length: count }, (_, index) => `line ${index}`);
const run = (count: number, indent = ''): string =>
  lines(count)
    .map((line) => `${indent}// ${line}`)
    .join('\n');
const jsDoc = (count: number, tags = ''): string =>
  `/**\n${lines(count)
    .map((line) => ` * ${line}`)
    .join('\n')}${tags}\n */`;

export const valid: readonly ValidTestCase<Options>[] = [
  {
    name: 'allows three lines inside a function body and reports four',
    code: `function f() {\n${run(3, '  ')}\n  return 1;\n}`,
  },
  {
    name: 'allows six JSDoc description lines, not counting tags',
    code: `${jsDoc(6, '\n * @param a One.\n * @param b Two.\n * @returns Three.')}\nfunction f(a, b) {}`,
  },
  {
    name: 'allows four lines for other comments and reports five',
    code: `${run(4)}\nconst a = 1;`,
  },
];

export const invalid: readonly InvalidTestCase<MessageIds, Options>[] = [
  {
    name: 'allows three lines inside a function body and reports four (2)',
    code: `function f() {\n${run(4, '  ')}\n  return 1;\n}`,
    errors: [{ messageId: 'bodyComment', data: { count: 4, max: 3 } }],
  },
  {
    name: 'allows six JSDoc description lines, not counting tags (2)',
    code: `${jsDoc(7)}\nfunction f() {}`,
    errors: [{ messageId: 'docDescription', data: { count: 7, max: 6 } }],
  },
  {
    name: 'allows four lines for other comments and reports five (2)',
    code: `${run(5)}\nconst a = 1;`,
    errors: [{ messageId: 'otherComment', data: { count: 5, max: 4 } }],
  },
  {
    name: 'honours options',
    code: `${run(2)}\nconst a = 1;`,
    options: [{ body: 1, docDescription: 1, other: 1 }],
    errors: [{ messageId: 'otherComment', data: { count: 2, max: 1 } }],
  },
];
