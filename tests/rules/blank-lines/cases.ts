import type { InvalidTestCase, ValidTestCase } from '@typescript-eslint/rule-tester';
import type { MessageIds, Options } from '../../../src/rules/blank-lines.js';

const fn = (...lines: string[]): string =>
  `function f() {\n${lines.map((line) => (line ? `  ${line}` : '')).join('\n')}\n}`;

export const valid: readonly ValidTestCase<Options>[] = [
  {
    name: 'keeps a two-statement block compact',
    code: fn('const total = sum(items);', 'return total;'),
  },
  {
    name: 'sets the return apart in a block of three statements',
    code: fn('const items = load();', 'log(items.length);', '', 'return items;'),
  },
  {
    name: 'leaves statements after an if, a loop or a block to @stylistic',
    code: fn('if (!a) return 0;', '', 'for (const x of a) use(x);', 'return 1;'),
  },
  {
    name: 'leaves blank lines with a comment in between alone',
    code: fn('const items = load();', 'log(items);', '// The caller owns the list.', 'return items;'),
  },
  {
    name: 'lets setup and assertions stay apart when attachConnected is off',
    code: fn('const result = run();', '', 'expect(result).toBe(1);'),
    options: [{ attachConnected: false }],
  },
  {
    name: 'checks switch cases like blocks',
    code: 'switch (a) {\n  case 1:\n    const b = a + 1;\n    return b;\n}',
  },
];

export const invalid: readonly InvalidTestCase<MessageIds, Options>[] = [
  {
    name: 'adds a blank line before the return of a longer block',
    code: fn('const items = load();', 'log(items.length);', 'return items;'),
    output: fn('const items = load();', 'log(items.length);', '', 'return items;'),
    errors: [{ messageId: 'missing' }],
  },
  {
    name: 'removes the blank line before the return of a two-statement block',
    code: fn('log(1);', '', 'return 2;'),
    output: fn('log(1);', 'return 2;'),
    errors: [{ messageId: 'unexpected' }],
  },
  {
    name: 'attaches a statement to the declaration it reads',
    code: fn('const result = run();', '', 'expect(result).toBe(1);'),
    output: fn('const result = run();', 'expect(result).toBe(1);'),
    errors: [{ messageId: 'connected' }],
  },
  {
    name: 'attaches a return to the declaration it reads, even in a longer block',
    code: fn('setup();', 'const total = sum(items);', '', 'return total;'),
    output: fn('setup();', 'const total = sum(items);', 'return total;'),
    errors: [{ messageId: 'connected' }],
  },
];
