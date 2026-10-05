import type { InvalidTestCase, ValidTestCase } from '@typescript-eslint/rule-tester';
import type { MessageIds, Options } from '../../../src/rules/prefer-mutation.js';

const ANGULAR = `import { inject } from '@angular/core';`;
const IMPORT = `${ANGULAR} import { HttpClient } from '@angular/common/http';`;

export const valid: readonly ValidTestCase<Options>[] = [
  {
    name: 'accepts long-lived subscriptions set up in the constructor, init hooks or field initializers',
    code: `${ANGULAR} class C {
      sub = this.route.params.subscribe();
      constructor() { toObservable(this.x).pipe(takeUntilDestroyed()).subscribe(); }
      ngOnInit() { this.form.valueChanges.subscribe(); }
    }`,
  },
  {
    name: 'accepts event streams that are properties rather than calls',
    code: `${ANGULAR} class C { open() { dialogRef.afterClosed.pipe(take(1)).subscribe(); this.form.valueChanges.subscribe(); } }`,
  },
  {
    name: 'leaves HttpClient GETs to prefer-http-resource',
    code: `${IMPORT} class C { private http = inject(HttpClient); load() { this.http.get('/rows').subscribe(); } }`,
  },
  {
    name: 'ignores subscribe outside classes',
    code: `${ANGULAR} function f(source) { source.subscribe(); }`,
  },
  {
    name: 'ignores files that are not Angular code',
    code: `class Worker { run() { this.queue.next().subscribe(); } }`,
  },
];

export const invalid: readonly InvalidTestCase<MessageIds, Options>[] = [
  {
    name: 'suggests httpMutation for an HttpClient POST subscribed in a handler',
    code: `${IMPORT} class C { private http = inject(HttpClient); save(row) { this.http.post('/rows', row).subscribe(); } }`,
    errors: [{ messageId: 'useHttpMutation', data: { member: 'http', verb: 'post', httpMethod: 'POST' } }],
  },
  {
    name: 'follows pipe() chains back to a constructor-injected HttpClient',
    code: `${IMPORT} class C { constructor(private api: HttpClient) {} remove(id) { this.api.delete('/rows/' + id).pipe(tap(() => {})).pipe(map(Boolean)).subscribe(); } }`,
    errors: [{ messageId: 'useHttpMutation', data: { member: 'api', verb: 'delete', httpMethod: 'DELETE' } }],
  },
  {
    name: 'suggests rxMutation for any other observable subscribed in a handler, including arrow-function members',
    code: `${ANGULAR} class C { save = (row) => { this.service.save(row).subscribe(); }; onClick() { this.service.run().subscribe(() => {}); } }`,
    errors: [
      { messageId: 'useRxMutation', data: { method: 'save' } },
      { messageId: 'useRxMutation', data: { method: 'onClick' } },
    ],
  },
];
