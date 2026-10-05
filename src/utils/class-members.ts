import type { TSESTree } from '@typescript-eslint/utils';
import { decoratorName, nameOf } from './ast.js';

export type ClassMember = TSESTree.ClassElement;

type Visibility = 'private' | 'protected' | 'public';

const VISIBILITY_RANK: Record<Visibility, number> = { private: 0, protected: 1, public: 2 };
const IO_CALLS = new Set(['input', 'model', 'output', 'outputFromObservable']);
const QUERY_CALLS = new Set(['viewChild', 'viewChildren', 'contentChild', 'contentChildren']);
const DERIVED_CALLS = new Set(['computed', 'linkedSignal', 'httpResource', 'resource', 'rxResource', 'toSignal']);
const IO_DECORATORS = new Set(['Input', 'Output']);
const QUERY_DECORATORS = new Set(['ViewChild', 'ViewChildren', 'ContentChild', 'ContentChildren']);
const LIFECYCLE_HOOKS = [
  'ngOnChanges',
  'ngOnInit',
  'ngDoCheck',
  'ngAfterContentInit',
  'ngAfterContentChecked',
  'ngAfterViewInit',
  'ngAfterViewChecked',
  'ngOnDestroy',
  'onModuleInit',
  'onApplicationBootstrap',
  'onModuleDestroy',
  'beforeApplicationShutdown',
  'onApplicationShutdown',
];

/** Member groups in the order they appear in a class. */
export const GROUPS = [
  'static',
  'injected',
  'input/output',
  'query',
  'signal',
  'derived',
  'field',
  'constructor',
  'lifecycle',
  'method',
] as const;

export type MemberGroup = (typeof GROUPS)[number];

/** Visibility of a class member, counting `#private` names as private. */
export function visibility(member: ClassMember): Visibility {
  if ('key' in member && member.key.type === 'PrivateIdentifier') return 'private';

  return ('accessibility' in member ? member.accessibility : undefined) ?? 'public';
}

/**
 * Whether a class member is a field whose initializer calls `inject()` while the class is constructed:
 * `inject(X)`, but also `inject(X).prop`, `inject(X).select(...)` or `toSignal(inject(X).changes)`. Calls
 * inside callbacks run later and do not count, matching angular-eslint's `inject-at-top`.
 */
export function isInjectedField(member: ClassMember): boolean {
  return member.type === 'PropertyDefinition' && !member.static && callsInjectEagerly(member.value);
}

/** Position of a member in the class order, as `[group, rank within group]`. */
export function memberRank(member: ClassMember): [number, number] {
  const group = memberGroup(member);
  const index = GROUPS.indexOf(group);
  if (group === 'injected') return [index, visibilityRank(member)];
  // Methods read the other way round: the public API first, helpers last.
  if (group === 'method') return [index, -VISIBILITY_RANK[visibility(member)]];
  if (group === 'lifecycle') return [index, LIFECYCLE_HOOKS.indexOf(keyName(member) ?? '')];

  return [index, 0];
}

/** The group a member belongs to, see `GROUPS`. */
export function memberGroup(member: ClassMember): MemberGroup {
  if ('static' in member && member.static) return 'static';
  if (member.type === 'MethodDefinition' && member.kind === 'constructor') return 'constructor';
  if (isMethod(member)) return LIFECYCLE_HOOKS.includes(keyName(member) ?? '') ? 'lifecycle' : 'method';
  if (member.type !== 'PropertyDefinition') return 'field';

  return fieldGroup(member);
}

/** Readable name of a member for messages. */
export function memberName(member: ClassMember): string {
  if ('key' in member && (member.key.type === 'Identifier' || member.key.type === 'PrivateIdentifier')) {
    return member.key.name;
  }

  if (member.type === 'TSIndexSignature') return '[index signature]';

  return member.type === 'MethodDefinition' && member.kind === 'constructor' ? 'constructor' : '[computed member]';
}

function keyName(member: ClassMember): string | undefined {
  return 'key' in member ? nameOf(member.key) : undefined;
}

function fieldGroup(member: TSESTree.PropertyDefinition): MemberGroup {
  const decorators = member.decorators.map(decoratorName);
  if (decorators.some((name) => name !== undefined && IO_DECORATORS.has(name))) return 'input/output';
  if (decorators.some((name) => name !== undefined && QUERY_DECORATORS.has(name))) return 'query';
  if (isInjectedField(member)) return 'injected';

  const call = initializerCall(member);
  if (call === null) return 'field';
  if (IO_CALLS.has(call)) return 'input/output';
  if (QUERY_CALLS.has(call)) return 'query';
  if (call === 'signal') return 'signal';

  return DERIVED_CALLS.has(call) ? 'derived' : 'field';
}

function callsInjectEagerly(node: TSESTree.Node | null): boolean {
  if (!node) return false;
  if (node.type === 'CallExpression' && node.callee.type === 'Identifier' && node.callee.name === 'inject') return true;
  if (node.type === 'ClassExpression' || (isFunction(node) && !isInvokedImmediately(node))) return false;

  return childNodes(node).some(callsInjectEagerly);
}

function isFunction(node: TSESTree.Node): boolean {
  return node.type === 'ArrowFunctionExpression' || node.type === 'FunctionExpression';
}

function isInvokedImmediately(node: TSESTree.Node): boolean {
  return node.parent?.type === 'CallExpression' && node.parent.callee === node;
}

function childNodes(node: TSESTree.Node): TSESTree.Node[] {
  return Object.entries(node)
    .filter(([key]) => key !== 'parent')
    .flatMap(([, value]: [string, unknown]) => (Array.isArray(value) ? value : [value]))
    .filter((value): value is TSESTree.Node => typeof value === 'object' && value !== null && 'type' in value);
}

function isMethod(member: ClassMember): boolean {
  return ['MethodDefinition', 'TSAbstractMethodDefinition'].includes(member.type);
}

function visibilityRank(member: ClassMember): number {
  const readonly = 'readonly' in member && member.readonly;
  return VISIBILITY_RANK[visibility(member)] * 2 + (readonly ? 0 : 1);
}

/** Name of the function a field is initialised with: `input` for both `input()` and `input.required()`. */
function initializerCall(member: TSESTree.PropertyDefinition): string | null {
  const callee = member.value?.type === 'CallExpression' ? member.value.callee : null;
  if (callee?.type === 'Identifier') return callee.name;
  if (callee?.type === 'MemberExpression' && callee.object.type === 'Identifier') return callee.object.name;

  return null;
}
