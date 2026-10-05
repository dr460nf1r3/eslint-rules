import type { TSESTree } from '@typescript-eslint/utils';

export type ClassNode = TSESTree.ClassDeclaration | TSESTree.ClassExpression;

export type FunctionNode =
  TSESTree.FunctionDeclaration | TSESTree.FunctionExpression | TSESTree.ArrowFunctionExpression;

export const DI_DECORATORS: ReadonlySet<string> = new Set([
  'Injectable',
  'Service',
  'Controller',
  'Component',
  'Directive',
  'Pipe',
  'WebSocketGateway',
]);

/**
 * @param decorator A `Decorator` node.
 * @returns The called or referenced decorator name, e.g. `Body` for `@Body()` and `Trace` for `@Trace`.
 */
export function decoratorName(decorator: TSESTree.Decorator): string | undefined {
  const expression = decorator.expression;
  const callee = expression.type === 'CallExpression' ? expression.callee : expression;
  return callee.type === 'Identifier' ? callee.name : undefined;
}

/**
 * @param node Any node that may carry `decorators`.
 * @param names The decorator names to look for.
 * @returns The first matching decorator, if any.
 */
export function findDecorator(
  node: { decorators?: TSESTree.Decorator[] },
  names: ReadonlySet<string>,
): TSESTree.Decorator | undefined {
  return (node.decorators ?? []).find((decorator) => names.has(decoratorName(decorator) ?? ''));
}

/**
 * @param classNode A class declaration or expression.
 * @returns Whether the class is created by a DI container (Nest or Angular).
 */
export function isDiClass(classNode: ClassNode): boolean {
  return findDecorator(classNode, DI_DECORATORS) !== undefined;
}

/**
 * @param node Any node.
 * @returns The nearest enclosing class, if any.
 */
export function enclosingClass(node: TSESTree.Node): ClassNode | undefined {
  for (let current = node.parent; current; current = current.parent) {
    if (current.type === 'ClassDeclaration' || current.type === 'ClassExpression') return current;
  }

  return undefined;
}

export interface ImportEntry {
  source: string;
  importedName: string;
}

export interface ImportTracker {
  visitor: { ImportDeclaration(node: TSESTree.ImportDeclaration): void };
  sourceOf(localName: string): ImportEntry | undefined;
  localNameOf(source: string, importedName: string): string | undefined;
}

/**
 * Tracks which local names were imported from which module, so rules match on the import source
 * instead of a bare class name that another project may reuse.
 * @returns `{ visitor, sourceOf, localNameOf }`. Spread `visitor` into the rule's listeners.
 */
export function createImportTracker(): ImportTracker {
  const sources = new Map<string, ImportEntry>();
  return {
    visitor: {
      ImportDeclaration(node) {
        for (const specifier of node.specifiers) {
          const importedName =
            specifier.type === 'ImportSpecifier' ? (nameOf(specifier.imported) ?? '') : specifier.local.name;
          sources.set(specifier.local.name, { source: node.source.value, importedName });
        }
      },
    },
    sourceOf: (localName) => sources.get(localName),
    localNameOf(source, importedName) {
      for (const [localName, entry] of sources) {
        if (entry.source === source && entry.importedName === importedName) return localName;
      }

      return undefined;
    },
  };
}

/**
 * @param node An identifier, private identifier or literal used as a key or import name.
 * @returns Its name, or `undefined` for computed keys.
 */
export function nameOf(node: TSESTree.Node | null | undefined): string | undefined {
  if (node?.type === 'Identifier' || node?.type === 'PrivateIdentifier') return node.name;

  if (node?.type === 'Literal' && (typeof node.value === 'string' || typeof node.value === 'number')) {
    return String(node.value);
  }

  return undefined;
}

/**
 * @param node A function declaration, expression or arrow function.
 * @returns Its declared or assigned name for messages, or `anonymous`.
 */
export function functionName(node: FunctionNode): string {
  if (node.id?.name) return node.id.name;

  const parent = node.parent;
  if (parent.type === 'MethodDefinition' || parent.type === 'PropertyDefinition') {
    return nameOf(parent.key) ?? 'anonymous';
  }

  if (parent.type === 'VariableDeclarator' && parent.id.type === 'Identifier') return parent.id.name;

  return 'anonymous';
}

/**
 * @param param A function parameter node.
 * @returns The parameter's binding name for messages.
 */
export function paramName(param: TSESTree.Node): string {
  switch (param.type) {
    case 'Identifier':
      return param.name;
    case 'AssignmentPattern':
      return paramName(param.left);
    case 'RestElement':
      return paramName(param.argument);
    case 'TSParameterProperty':
      return paramName(param.parameter);
    default:
      return 'options';
  }
}
