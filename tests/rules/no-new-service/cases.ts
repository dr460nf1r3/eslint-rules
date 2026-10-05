import type { InvalidTestCase, ValidTestCase } from '@typescript-eslint/rule-tester';
import type { MessageIds, Options } from '../../../src/rules/no-new-service.js';

export const valid: readonly ValidTestCase<Options>[] = [
  {
    name: 'accepts value objects and exceptions',
    code: '@Injectable() class S { run() { new Money(1); throw new NotFoundException({}); } }',
  },
  {
    name: 'accepts construction outside DI classes, e.g. in a factory or bootstrap',
    code: 'export const service = new MailService();',
  },
];

export const invalid: readonly InvalidTestCase<MessageIds, Options>[] = [
  {
    name: 'reports constructing a service inside an injectable class',
    code: '@Injectable() class InvoiceService { private mail = new MailService(); }',
    errors: [
      { messageId: 'newDependency', data: { name: 'MailService', owner: 'InvoiceService', field: 'mailService' } },
    ],
  },
  {
    name: 'reports repositories and clients inside components',
    code: '@Component({}) class C { load() { return new InvoiceRepository().all(new ApiClient()); } }',
    errors: [
      { messageId: 'newDependency', data: { name: 'InvoiceRepository', owner: 'C', field: 'invoiceRepository' } },
      { messageId: 'newDependency', data: { name: 'ApiClient', owner: 'C', field: 'apiClient' } },
    ],
  },
];
