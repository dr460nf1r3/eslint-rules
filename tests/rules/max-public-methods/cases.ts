import type { InvalidTestCase, ValidTestCase } from '@typescript-eslint/rule-tester';
import type { MessageIds, Options } from '../../../src/rules/max-public-methods.js';

const methods = (count: number, modifier = ''): string =>
  Array.from({ length: count }, (_, index) => `${modifier} m${index}() {}`).join('\n');

export const valid: readonly ValidTestCase<Options>[] = [
  {
    name: 'accepts ten public methods',
    code: `class A { ${methods(10)} }`,
  },
  {
    name: 'does not count private, protected, accessors or Angular lifecycle hooks',
    code: `class A { ${methods(10)} ${methods(3, 'private')} protected p() {} get x() { return 1; } ngOnInit() {} ngOnDestroy() {} #hidden() {} }`,
  },
];

export const invalid: readonly InvalidTestCase<MessageIds, Options>[] = [
  {
    name: 'reports eleven public methods',
    code: `class A { ${methods(11)} }`,
    errors: [{ messageId: 'tooMany', data: { name: 'A', count: 11, max: 10 } }],
  },
];
