import type { InvalidTestCase, ValidTestCase } from '@typescript-eslint/rule-tester';
import type { MessageIds, Options } from '../../../src/rules/decorator-order.js';

const method = (...decorators: string[]): string =>
  `class C {\n${decorators.map((line) => `  ${line}`).join('\n')}\n  list() {}\n}`;

export const valid: readonly ValidTestCase<Options>[] = [
  {
    name: 'accepts route, behaviour, operation, parameters, responses, trace',
    code: method(
      '@Get("list")',
      '@UseGuards(AuthGuard)',
      '@HttpCode(200)',
      '@ApiOperation({})',
      '@ApiQuery({})',
      '@ApiResponse({})',
      '@ApiOkResponse({})',
      '@Trace',
    ),
  },
  {
    name: 'keeps the order of repeated decorators',
    code: method('@Get()', '@ApiResponse({ status: 200 })', '@ApiResponse({ status: 404 })', '@Trace'),
  },
  {
    name: 'leaves metadata with spreads alone',
    code: "@Component({ ...base, selector: 'a' })\nclass A {}",
  },
];

export const invalid: readonly InvalidTestCase<MessageIds, Options>[] = [
  {
    name: 'moves @Trace to the bottom and the route to the top',
    code: method('@Trace', '@ApiResponse({})', '@ApiOperation({})', '@Post("save")'),
    output: method('@Post("save")', '@ApiOperation({})', '@ApiResponse({})', '@Trace'),
    errors: [{ messageId: 'decoratorOrder', data: { name: 'Post' } }],
  },
  {
    name: 'reports without fixing when comments sit between decorators',
    code: method('@Trace', '// why', '@Get()'),
    output: null,
    errors: [{ messageId: 'decoratorOrder', data: { name: 'Get' } }],
  },
  {
    name: 'orders component metadata keys',
    code: "@Component({\n  templateUrl: './a.html',\n  providers: [],\n  selector: 'app-a',\n  imports: [],\n})\nclass A {}",
    output:
      "@Component({\n  selector: 'app-a',\n  imports: [],\n  templateUrl: './a.html',\n  providers: [],\n})\nclass A {}",
    errors: [{ messageId: 'metadataOrder', data: { name: 'selector' } }],
  },
];
