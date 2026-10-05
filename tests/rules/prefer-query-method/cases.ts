import type { InvalidTestCase, ValidTestCase } from '@typescript-eslint/rule-tester';
import type { MessageIds, Options } from '../../../src/rules/prefer-query-method.js';

const NEST = `import { Controller, Get, Query, Param } from '@nestjs/common';`;
const HTTP = `import { HttpClient, httpResource } from '@angular/common/http';`;

export const valid: readonly ValidTestCase<Options>[] = [
  {
    name: 'accepts @Get() handlers that only use path params',
    code: `${NEST} class C { @Get(':id') one(@Param('id') id: string) {} }`,
  },
  {
    name: 'ignores a @Query() decorator that does not come from Nest',
    code: `import { Get } from '@nestjs/common'; import { Query } from './own'; class C { @Get() list(@Query() q) {} }`,
  },
  {
    name: 'accepts httpResource requests that already choose a method or carry no query string',
    code: `${HTTP} class C {
        a = httpResource(() => ({ url: '/rows', method: 'QUERY', body: { page: 1 } }));
        b = httpResource(() => \`\${this.api}/rows/\${this.id()}\`);
      }`,
  },
  {
    name: 'ignores get() on things that are not HttpClient',
    code: `class C { map = new Map(); x() { return this.map.get('/a?b=c'); } }`,
  },
];

export const invalid: readonly InvalidTestCase<MessageIds, Options>[] = [
  {
    name: 'reports a @Get() handler that reads @Query() params, once per handler',
    code: `${NEST} class C { @Get('batches') list(@Query('itemCode') itemCode?: string, @Query('batch') batch?: string) {} }`,
    errors: [{ messageId: 'useQueryMethod', data: { method: 'list' } }],
  },
  {
    name: 'reports httpResource requests built with params or a ?key= url',
    code: `${HTTP} class C {
        a = httpResource(() => ({ url: '/rows', params: { page: 1 } }));
        b = httpResource(() => \`\${this.api}/rows?id=\${this.id()}\`);
        c = httpResource.text(() => { return { url: \`\${this.api}/rows?id=\${this.id()}\` }; });
      }`,
    errors: [
      { messageId: 'useQueryBody', line: 2 },
      { messageId: 'useQueryBody', line: 3 },
      { messageId: 'useQueryBody', line: 4 },
    ],
  },
  {
    name: 'reports HttpClient.get with params or a ?key= url',
    code: `${HTTP} class C { http = inject(HttpClient);
        a() { return this.http.get('/rows', { params: { page: 1 } }); }
        b(id) { return this.http.get(\`/rows?id=\${id}\`); }
        c() { return this.http.get('/rows'); }
      }`,
    errors: [
      { messageId: 'useQueryBody', line: 2 },
      { messageId: 'useQueryBody', line: 3 },
    ],
  },
];
