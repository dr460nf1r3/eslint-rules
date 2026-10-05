import type { TSESTree } from '@typescript-eslint/utils';
import type { ImportTracker } from './ast.js';

export const ANGULAR_HTTP = '@angular/common/http';

export interface HttpClientMembers {
  visitor: {
    'PropertyDefinition > CallExpression.value[callee.name="inject"]'(node: TSESTree.CallExpression): void;
    'TSParameterProperty'(node: TSESTree.TSParameterProperty): void;
  };
  members: ReadonlySet<string>;
}

/**
 * Collects the class members that hold an Angular `HttpClient`, injected either with
 * `inject(HttpClient)` in a field or as a typed constructor parameter property.
 * @param imports The rule's import tracker, so only `HttpClient` from `@angular/common/http` counts.
 * @returns `{ visitor, members }`. Spread `visitor` into the rule's listeners and read `members` on `Program:exit`.
 */
export function createHttpClientMembers(imports: ImportTracker): HttpClientMembers {
  const members = new Set<string>();
  const isHttpClient = (name: string): boolean => {
    const entry = imports.sourceOf(name);
    return entry?.source === ANGULAR_HTTP && entry.importedName === 'HttpClient';
  };

  return {
    members,
    visitor: {
      'PropertyDefinition > CallExpression.value[callee.name="inject"]'(node) {
        const [token] = node.arguments;
        if (token?.type !== 'Identifier' || !isHttpClient(token.name)) return;

        const key = node.parent.type === 'PropertyDefinition' ? memberKeyName(node.parent.key) : undefined;
        if (key !== undefined) {
          members.add(key);
        }
      },
      'TSParameterProperty'(node) {
        const parameter = node.parameter;
        if (parameter.type !== 'Identifier') return;

        const type = parameter.typeAnnotation?.typeAnnotation;
        if (
          type?.type === 'TSTypeReference' &&
          type.typeName.type === 'Identifier' &&
          isHttpClient(type.typeName.name)
        ) {
          members.add(parameter.name);
        }
      },
    },
  };
}

/**
 * @param node A member key or `MemberExpression` property.
 * @returns The identifier or private identifier name, `undefined` for anything else.
 */
export function memberKeyName(node: TSESTree.Node): string | undefined {
  return node.type === 'Identifier' || node.type === 'PrivateIdentifier' ? node.name : undefined;
}

/**
 * @param node A call's callee.
 * @returns For `this.member.verb`, the member name and verb.
 */
export function thisMemberCall(node: TSESTree.Node): { member: string; verb: string } | undefined {
  if (node.type !== 'MemberExpression' || node.object.type !== 'MemberExpression') return undefined;
  if (node.object.object.type !== 'ThisExpression') return undefined;

  const member = memberKeyName(node.object.property);
  const verb = memberKeyName(node.property);
  return member !== undefined && verb !== undefined ? { member, verb } : undefined;
}
