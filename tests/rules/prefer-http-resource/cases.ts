import type { InvalidTestCase, ValidTestCase } from '@typescript-eslint/rule-tester';
import type { MessageIds, Options } from '../../../src/rules/prefer-http-resource.js';

const IMPORT = `import { HttpClient } from '@angular/common/http';`;

export const valid: readonly ValidTestCase<Options>[] = [
  {
    name: 'accepts mutations',
    code: `${IMPORT} class C { private http = inject(HttpClient); save(row) { return firstValueFrom(this.http.post('/rows', row)); } }`,
  },
  {
    name: 'ignores get() on things that are not HttpClient',
    code: `class C { form = inject(FormBuilder); x() { return this.form.get('name'); } }`,
  },
];

export const invalid: readonly InvalidTestCase<MessageIds, Options>[] = [
  {
    name: 'reports a manual GET through an inject()ed HttpClient',
    code: `${IMPORT} class C { private http = inject(HttpClient); load() { this.http.get<Row[]>('/rows').subscribe(); } }`,
    errors: [{ messageId: 'useHttpResource', data: { member: 'http' } }],
  },
  {
    name: 'reports a manual GET through a constructor-injected HttpClient',
    code: `${IMPORT} class C { constructor(private readonly httpClient: HttpClient) {} load() { return this.httpClient.get('/rows'); } }`,
    errors: [{ messageId: 'useHttpResource', data: { member: 'httpClient' } }],
  },
];
