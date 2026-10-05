import type { InvalidTestCase, ValidTestCase } from '@typescript-eslint/rule-tester';
import type { MessageIds, Options } from '../../../src/rules/max-dependencies.js';

const fields = (count: number): string =>
  Array.from({ length: count }, (_, index) => `dep${index} = inject(Dep${index});`).join('\n');

export const valid: readonly ValidTestCase<Options>[] = [
  {
    name: 'accepts five injected fields',
    code: `@Service() class InvoiceService { ${fields(5)} }`,
  },
  {
    name: 'ignores classes the DI container does not create',
    code: 'class Money { constructor(a, b, c, d, e, f) {} }',
  },
];

export const invalid: readonly InvalidTestCase<MessageIds, Options>[] = [
  {
    name: 'counts inject() fields and constructor parameters together',
    code: `@Injectable() class InvoiceService { ${fields(3)} constructor(private a: A, private b: B, private c: C) {} }`,
    errors: [{ messageId: 'tooMany', data: { name: 'InvoiceService', count: 6, max: 5 } }],
  },
];
