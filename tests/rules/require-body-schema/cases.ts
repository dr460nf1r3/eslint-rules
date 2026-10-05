import type { InvalidTestCase, ValidTestCase } from '@typescript-eslint/rule-tester';
import type { MessageIds, Options } from '../../../src/rules/require-body-schema.js';

const controller = (params: string): string => `
  import { Body, Param, Query } from '@nestjs/common';
  class InvoiceController { update(${params}) {} }
`;

export const valid: readonly ValidTestCase<Options>[] = [
  {
    name: 'accepts the shape @Body({ schema })',
    code: controller('@Body({ schema: invoiceSchema }) body: Invoice'),
  },
  {
    name: 'accepts a property plus schema option',
    code: controller(`@Body('lines', { schema: linesSchema }) lines: Line[]`),
  },
  {
    name: 'accepts primitive @Param and @Query values, also with ParseIntPipe',
    code: controller(
      `@Param('code') code: string, @Query('page', ParseIntPipe) page: number, @Query('all') all: boolean, @Param('x') x`,
    ),
  },
  {
    name: 'reports a @Query bound to a DTO type and accepts it with a schema',
    code: controller('@Query({ schema: searchSchema }) query: Search'),
  },
  {
    name: 'skips @Param and @Query when checkParams is off',
    code: controller('@Query() query: SearchDto'),
    options: [{ checkParams: false }],
  },
  {
    name: 'ignores a Body decorator that is not Nest',
    code: `import { Body } from './x'; class C { m(@Body() b: X) {} }`,
  },
];

export const invalid: readonly InvalidTestCase<MessageIds, Options>[] = [
  {
    name: 'reports a bare @Body() typed with an interface',
    code: controller('@Body() body: InvoiceHeader'),
    errors: [{ messageId: 'missingSchema', data: { decorator: 'Body', param: 'body', schemaName: 'bodySchema' } }],
  },
  {
    name: 'reports a zod pipe instead of the schema option',
    code: controller('@Body(new ZodValidationPipe(createDashboardSchema, errors)) body: CreateDashboardRequest'),
    errors: [{ messageId: 'useSchemaOption', data: { decorator: 'Body', param: 'body' } }],
  },
  {
    name: 'reports a @Query bound to a DTO type and accepts it with a schema (2)',
    code: controller('@Query() query: SearchDto'),
    errors: [{ messageId: 'missingSchema', data: { decorator: 'Query', param: 'query', schemaName: 'querySchema' } }],
  },
];
