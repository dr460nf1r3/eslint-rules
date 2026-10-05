import type { InvalidTestCase, ValidTestCase } from '@typescript-eslint/rule-tester';
import type { MessageIds, Options } from '../../../src/rules/no-llm-artifacts.js';

const PLACEHOLDERS = [
  '// ... existing code ...',
  '// rest of the method remains the same',
  '// TODO: implement',
  '/* omitted for brevity */',
  '// your code here',
  '// same as above',
];

export const valid: readonly ValidTestCase<Options>[] = [
  {
    name: 'accepts ordinary comments',
    code: `// B1 rounds per line\nconst a = 1;`,
  },
];

export const invalid: readonly InvalidTestCase<MessageIds, Options>[] = [
  ...PLACEHOLDERS.map((comment): InvalidTestCase<MessageIds, Options> => ({
    name: `reports ${comment}`,
    code: `${comment}\nconst a = 1;`,
    errors: [{ messageId: 'artifact' }],
  })),
  {
    name: 'reports a not-implemented stub',
    code: `function price() { throw new Error('Not implemented'); }`,
    errors: [{ messageId: 'stub' }],
  },
];
