import type { TSESTree } from '@typescript-eslint/utils';
import { createImportTracker, decoratorName, type ImportTracker } from '../utils/ast.js';
import { createRule } from '../utils/create-rule.js';
import { ANGULAR_HTTP, createHttpClientMembers, memberKeyName, thisMemberCall } from '../utils/http-client-members.js';
import { guidance } from '../utils/message.js';

export type Options = [];

export type MessageIds = 'useQueryMethod' | 'useQueryBody';

export const RULE_NAME = 'prefer-query-method';

const NEST = '@nestjs/common';
const QUERY_STRING = /\?[\w.-]+=/;
const CORS_NOTE =
  'Bare `app.enableCors()` only allows GET/HEAD/PUT/PATCH/POST/DELETE, so a cross-origin QUERY fails its preflight until main.ts passes `{ methods: [..., "QUERY"] }`.';

/**
 * Reads with filter input go through the HTTP QUERY method: a safe, idempotent request whose input
 * travels as a validated body instead of a `?key=value` string. Nest routes it with `@QueryMethod()`,
 * Angular sends it with `method: 'QUERY'` on `httpResource` or `HttpClient.request`.
 * Paginated tables are left alone because `@TableQuery()` and the partui5 table resource own that contract.
 */
export default createRule<Options, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Use the HTTP QUERY method with a body instead of ?query params',
      frameworks: ['Angular', 'NestJS'],
    },
    schema: [],
    messages: {
      useQueryMethod: guidance({
        problem: '@Get() handler `{{method}}` reads its input from the query string via @Query().',
        why: 'Query strings are untyped text: numbers and arrays need manual parsing, values end up in access logs, and URL length caps complex filters. QUERY is just as safe and idempotent as GET but carries a body.',
        fix: `Replace \`@Get()\` with \`@QueryMethod()\` (\`@nestjs/common\`) and the @Query() parameters with one \`@Body({ schema: <name>Schema }) input: <Name>\`. ${CORS_NOTE}`,
      }),
      useQueryBody: guidance({
        problem: 'This request sends its input as `?` query params.',
        why: 'Query strings are untyped text, end up in access logs, and are capped in length. QUERY is just as safe and idempotent as GET but carries a JSON body.',
        fix: `Send \`httpResource(() => ({ url: \`\${this.config.apiUrl()}/...\`, method: 'QUERY', body: { ... } }))\` and serve it with \`@QueryMethod()\` + \`@Body({ schema })\` on the backend. ${CORS_NOTE}`,
      }),
    },
  },
  defaultOptions: [],

  create(context) {
    const imports = createImportTracker();
    const http = createHttpClientMembers(imports);
    const memberGets: TSESTree.CallExpression[] = [];
    const isFrom = importChecker(imports);
    const isNestQuery = (decorator: TSESTree.Decorator): boolean => isFrom(decoratorName(decorator), NEST, 'Query');
    const reportRequest = (node: TSESTree.Node): void => context.report({ node, messageId: 'useQueryBody' });
    return {
      ...imports.visitor,
      ...http.visitor,
      'Decorator'(node) {
        const name = decoratorName(node);
        if (name !== 'Get' || !isFrom(name, NEST, 'Get') || node.parent.type !== 'MethodDefinition') return;

        const handler = node.parent;
        if (handler.value.params.some((param) => hasDecorator(param, isNestQuery))) {
          const method = memberKeyName(handler.key) ?? '<computed>';
          context.report({ node, messageId: 'useQueryMethod', data: { method } });
        }
      },
      'CallExpression'(node) {
        if (isHttpResourceCall(node, (name) => isFrom(name, ANGULAR_HTTP, 'httpResource'))) {
          returnedRequests(node.arguments[0]).filter(sendsQueryString).forEach(reportRequest);
        }

        if (thisMemberCall(node.callee)?.verb === 'get') {
          memberGets.push(node);
        }
      },
      'Program:exit'() {
        for (const node of memberGets) {
          const [url, options] = node.arguments;
          const member = thisMemberCall(node.callee)?.member ?? '';
          if (http.members.has(member) && (hasQueryString(url) || hasProperty(options, 'params'))) {
            reportRequest(node);
          }
        }
      },
    };
  },
});

/** Matches a local name against the module and name it was imported as. */
function importChecker(
  imports: ImportTracker,
): (name: string | undefined, source: string, importedName: string) => boolean {
  return (name, source, importedName) => {
    const entry = imports.sourceOf(name ?? '');
    return entry?.source === source && entry.importedName === importedName;
  };
}

function hasDecorator(param: TSESTree.Parameter, predicate: (decorator: TSESTree.Decorator) => boolean): boolean {
  const decorators =
    param.type === 'TSParameterProperty' ? [...param.parameter.decorators, ...param.decorators] : param.decorators;
  return decorators.some(predicate);
}

function isHttpResourceCall(node: TSESTree.CallExpression, isHttpResource: (name: string) => boolean): boolean {
  const callee = node.callee;
  const target = callee.type === 'MemberExpression' ? callee.object : callee;
  return target.type === 'Identifier' && isHttpResource(target.name);
}

/** The request factory may return the object directly or from a block body. */
function returnedRequests(factory: TSESTree.Node | undefined): TSESTree.Node[] {
  if (factory?.type !== 'ArrowFunctionExpression' && factory?.type !== 'FunctionExpression') return [];
  if (factory.body.type !== 'BlockStatement') return [factory.body];

  return factory.body.body.flatMap((statement) =>
    statement.type === 'ReturnStatement' && statement.argument ? [statement.argument] : [],
  );
}

function sendsQueryString(request: TSESTree.Node): boolean {
  if (request.type !== 'ObjectExpression') return hasQueryString(request);
  if (hasProperty(request, 'method')) return false;

  return hasProperty(request, 'params') || hasQueryString(propertyValue(request, 'url'));
}

function hasProperty(node: TSESTree.Node | undefined, name: string): boolean {
  return propertyValue(node, name) !== undefined;
}

function propertyValue(node: TSESTree.Node | undefined, name: string): TSESTree.Node | undefined {
  if (node?.type !== 'ObjectExpression') return undefined;

  const property = node.properties.find(
    (candidate) => candidate.type === 'Property' && candidate.key.type === 'Identifier' && candidate.key.name === name,
  );
  return property?.type === 'Property' ? property.value : undefined;
}

function hasQueryString(node: TSESTree.Node | undefined): boolean {
  if (node?.type === 'Literal') return typeof node.value === 'string' && QUERY_STRING.test(node.value);

  if (node?.type === 'TemplateLiteral') {
    return QUERY_STRING.test(node.quasis.map((quasi) => quasi.value.cooked).join('x'));
  }

  return false;
}

export const RULE_DOCS_EXTENSION = {
  rationale:
    "Query strings are untyped text: numbers and arrays need manual parsing, values end up in access logs, and URL length caps complex filters. The HTTP QUERY method is just as safe and idempotent as GET but carries a validated body, routed in Nest with `@QueryMethod()` and sent from Angular with `method: 'QUERY'`. Nest `@Get()` handlers reading `@Query()` and Angular `httpResource`/`HttpClient.get` requests with `params` or a `?key=` URL are reported.",
};
