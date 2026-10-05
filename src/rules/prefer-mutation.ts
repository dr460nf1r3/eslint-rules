import type { TSESTree } from '@typescript-eslint/utils';
import { createImportTracker } from '../utils/ast.js';
import { createRule } from '../utils/create-rule.js';
import { createHttpClientMembers, thisMemberCall } from '../utils/http-client-members.js';
import { guidance } from '../utils/message.js';

export type Options = [];

export type MessageIds = 'useHttpMutation' | 'useRxMutation';

export const RULE_NAME = 'prefer-mutation';

/** `get` is matched only to leave it to `prefer-http-resource`. */
const HTTP_VERBS: ReadonlySet<string> = new Set(['get', 'post', 'put', 'patch', 'delete', 'request']);
const SETUP_MEMBERS: ReadonlySet<string> = new Set([
  'constructor',
  'ngOnInit',
  'ngOnChanges',
  'ngAfterViewInit',
  'ngAfterContentInit',
]);
const FIX_TAIL =
  'Await the call: `const result = await this.save(row)` resolves to `{ status: "success" | "error" | "aborted" }`, and the mutation exposes `isPending()`, `error()`, `value()` as signals for the template. Pick `switchOp`/`exhaustOp`/`mergeOp` via `operator` when calls may overlap (default `concatOp`).';

type ClassMember = TSESTree.ClassElement;

interface MutationReport {
  messageId: MessageIds;
  data: Record<string, string>;
}

/**
 * A `.subscribe()` inside an event-style method usually fires a one-off action, which is what
 * `httpMutation`/`rxMutation` from `@part/partui5` model. Subscriptions set up in the constructor or init
 * hooks are long-lived streams and stay allowed. Only files importing `@angular/core` are checked,
 * and only chains that start at a call: stream properties such as `afterClosed` or `valueChanges` are events,
 * not actions. Without type info, `.pipe()` chains are followed back to their source to tell an `HttpClient`
 * write apart from any other observable.
 */
export default createRule<Options, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Use httpMutation/rxMutation from @part/partui5 instead of subscribing to one-off actions',
      frameworks: ['Angular'],
    },
    schema: [],
    messages: {
      useHttpMutation: guidance({
        problem: '`this.{{member}}.{{verb}}(...).subscribe()` sends a write by hand.',
        why: 'The subscription is never cleaned up, overlapping calls race, and pending/error state is re-implemented with ad-hoc flags.',
        fix: `Declare \`readonly save = httpMutation((row: Row) => ({ url: \`\${this.config.apiUrl()}/...\`, method: '{{httpMethod}}', body: row }))\` (import from \`@part/partui5\`). ${FIX_TAIL}`,
      }),
      useRxMutation: guidance({
        problem: '`.subscribe()` in `{{method}}()` triggers a one-off action by hand.',
        why: 'The subscription is never cleaned up, overlapping calls race, and pending/error state is re-implemented with ad-hoc flags.',
        fix: `Declare \`readonly run = rxMutation((param: P) => this.service.doSomething(param))\` (import from \`@part/partui5\`). ${FIX_TAIL}`,
      }),
    },
  },
  defaultOptions: [],

  create(context) {
    const imports = createImportTracker();
    const http = createHttpClientMembers(imports);
    const subscribeCalls: TSESTree.MemberExpression[] = [];
    return {
      ...imports.visitor,
      ...http.visitor,
      'CallExpression > MemberExpression.callee[property.name="subscribe"]'(node: TSESTree.MemberExpression) {
        subscribeCalls.push(node);
      },
      'Program:exit'(program: TSESTree.Program) {
        if (!hasAngularCoreImport(program)) return;

        for (const node of subscribeCalls) {
          const report = reportFor(node, http.members);
          if (report) {
            context.report({ node: node.property, ...report });
          }
        }
      },
    };
  },
});

function reportFor(
  subscribeCallee: TSESTree.MemberExpression,
  httpMembers: ReadonlySet<string>,
): MutationReport | undefined {
  const member = enclosingClassMember(subscribeCallee);
  if (!member || isSetupMember(member)) return undefined;

  const source = stripPipes(subscribeCallee.object);
  if (source.type !== 'CallExpression') return undefined;

  const call = thisMemberCall(source.callee);
  const httpCall = call && httpMembers.has(call.member) && HTTP_VERBS.has(call.verb) ? call : undefined;
  if (httpCall?.verb === 'get') return undefined;

  if (httpCall) {
    const httpMethod = httpCall.verb === 'request' ? 'POST' : httpCall.verb.toUpperCase();
    return { messageId: 'useHttpMutation', data: { ...httpCall, httpMethod } };
  }

  return { messageId: 'useRxMutation', data: { method: memberName(member) } };
}

function enclosingClassMember(node: TSESTree.Node): ClassMember | undefined {
  for (let current = node.parent; current; current = current.parent) {
    if (current.parent?.type === 'ClassBody') return current as ClassMember;
  }

  return undefined;
}

function isSetupMember(member: ClassMember): boolean {
  if (member.type === 'MethodDefinition') return SETUP_MEMBERS.has(memberName(member));

  const value = 'value' in member ? member.value : undefined;
  return value?.type !== 'ArrowFunctionExpression' && value?.type !== 'FunctionExpression';
}

function memberName(member: ClassMember): string {
  return 'key' in member && member.key.type === 'Identifier' ? member.key.name : '<computed>';
}

function stripPipes(node: TSESTree.Expression): TSESTree.Expression {
  let current = node;
  while (
    current.type === 'CallExpression' &&
    current.callee.type === 'MemberExpression' &&
    current.callee.property.type === 'Identifier' &&
    current.callee.property.name === 'pipe'
  ) {
    current = current.callee.object;
  }

  return current;
}

function hasAngularCoreImport(program: TSESTree.Program): boolean {
  return program.body.some((node) => node.type === 'ImportDeclaration' && node.source.value === '@angular/core');
}

export const RULE_DOCS_EXTENSION = {
  rationale:
    'A `.subscribe()` inside an event-style method usually fires a one-off action: the subscription is never cleaned up, overlapping calls race, and pending/error state is re-implemented with ad-hoc flags. `httpMutation`/`rxMutation` from `@part/partui5` model these actions with signals. Long-lived subscriptions in the constructor, init hooks or field initializers stay allowed, and `HttpClient` GETs are left to `prefer-http-resource`.',
};
