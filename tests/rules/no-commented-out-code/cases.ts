import type { InvalidTestCase, ValidTestCase } from '@typescript-eslint/rule-tester';
import type { MessageIds, Options } from '../../../src/rules/no-commented-out-code.js';

export const valid: readonly ValidTestCase<Options>[] = [
  {
    name: 'accepts prose, single words, TODOs and URLs',
    code: `// B1 rounds per line, not per document\n// Year\n// TODO: remove after migration\n// https://help.sap.com/x\n/** @param x The value. */\nconst a = 1;`,
  },
];

export const invalid: readonly InvalidTestCase<MessageIds, Options>[] = [
  {
    name: 'reports commented-out statements',
    code: `// const total = lines.reduce((sum, line) => sum + line.price, 0);\nconst a = 1;`,
    errors: [{ messageId: 'commentedCode' }],
  },
  {
    name: 'groups a run of commented-out lines into one report',
    code: `// if (x) {\n//   doThing(x);\n// }\nconst a = 1;`,
    errors: [{ messageId: 'commentedCode', line: 1, endLine: 3 }],
  },
  {
    name: 'reports commented-out code in block comments',
    code: `/* this.load(); */\nconst a = 1;`,
    errors: [{ messageId: 'commentedCode' }],
  },
];
