import type { TSESTree } from '@typescript-eslint/utils';
import { createImportTracker } from '../utils/ast.js';
import { createRule } from '../utils/create-rule.js';
import { createHttpClientMembers, thisMemberCall } from '../utils/http-client-members.js';
import { guidance } from '../utils/message.js';

export type Options = [];

export type MessageIds = 'useHttpResource';

export const RULE_NAME = 'prefer-http-resource';

const THIS_MEMBER_GET =
  'CallExpression > MemberExpression.callee[property.name="get"][object.type="MemberExpression"][object.object.type="ThisExpression"]';

/**
 * Reads go through `httpResource`, which returns signals with loading and error state built in.
 * Only `get` on a member known to be an `HttpClient` is reported. Mutations keep using `HttpClient`.
 */
export default createRule<Options, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Use httpResource for GET requests instead of HttpClient.get',
      preset: 'recommended',
      frameworks: ['Angular'],
    },
    schema: [],
    messages: {
      useHttpResource: guidance({
        problem: '`this.{{member}}.get(...)` fetches data by hand.',
        why: 'A manual GET plus subscribe leaks subscriptions and re-implements loading/error state that `httpResource` provides as signals.',
        fix: 'Declare `readonly rows = httpResource<Row[]>(() => ({ url: `${this.config.apiUrl()}/...`, params }))` and read `rows.value()`, `rows.isLoading()`, `rows.error()` in the template. Keep `HttpClient` + `firstValueFrom` only for POST/PATCH/PUT/DELETE.',
      }),
    },
  },
  defaultOptions: [],

  create(context) {
    const imports = createImportTracker();
    const http = createHttpClientMembers(imports);
    const getCalls: TSESTree.MemberExpression[] = [];

    return {
      ...imports.visitor,
      ...http.visitor,
      [THIS_MEMBER_GET](node: TSESTree.MemberExpression) {
        getCalls.push(node);
      },
      'Program:exit'() {
        for (const node of getCalls) {
          const member = thisMemberCall(node)?.member;
          if (member !== undefined && http.members.has(member)) {
            context.report({ node, messageId: 'useHttpResource', data: { member } });
          }
        }
      },
    };
  },
});

export const RULE_DOCS_EXTENSION = {
  rationale:
    'A manual `HttpClient.get` plus subscribe leaks subscriptions and re-implements the loading and error state that `httpResource` provides as signals. Only `get` on a member known to be an `HttpClient` is reported; writes keep using `HttpClient`.',
};
