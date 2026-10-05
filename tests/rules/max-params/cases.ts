import type { InvalidTestCase, ValidTestCase } from '@typescript-eslint/rule-tester';
import type { MessageIds, Options } from '../../../src/rules/max-params.js';

export const valid: readonly ValidTestCase<Options>[] = [
  {
    name: 'accepts three parameters',
    code: 'function price(item: string, quantity: number, discount: number) {}',
  },
  {
    name: 'ignores decorated Nest handler parameters',
    code: "class C { list(@User() user, @Param('id') id, @Query('q') q, @Body({ schema: s }) body, extra) {} }",
  },
  {
    name: 'ignores constructors because they list injected dependencies',
    code: 'class C { constructor(a, b, c, d, e) {} }',
  },
];

export const invalid: readonly InvalidTestCase<MessageIds, Options>[] = [
  {
    name: 'reports four parameters and names them in the parameter-object hint',
    code: 'const price = (item, quantity, discount, currency) => item;',
    errors: [
      { messageId: 'tooMany', data: { name: 'price', count: 4, max: 3, params: 'item, quantity, discount, currency' } },
    ],
  },
  {
    name: 'honours the max option',
    code: 'function f(a, b) {}',
    options: [{ max: 1 }],
    errors: [{ messageId: 'tooMany' }],
  },
];
