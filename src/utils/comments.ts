import { parse } from '@typescript-eslint/parser';
import type { TSESLint, TSESTree } from '@typescript-eslint/utils';

type SourceCode = Readonly<TSESLint.SourceCode>;

const DIRECTIVE =
  /^\s*(eslint|global|globals|exported|istanbul|c8|v8|prettier-ignore|@ts-|webpack|tslint|jshint|#\s*sourceMappingURL|<reference)/;

/**
 * @param comment An ESLint comment token.
 * @returns Whether the comment is a tool directive rather than prose.
 */
export function isDirective(comment: TSESTree.Comment): boolean {
  return DIRECTIVE.test(comment.value) || comment.value.startsWith('/');
}

/**
 * @param comment An ESLint comment token.
 * @returns Whether the comment is a `/** ... *\/` doc comment.
 */
export function isJsDoc(comment: TSESTree.Comment): boolean {
  return comment.type === 'Block' && comment.value.startsWith('*');
}

/**
 * @param sourceCode The rule's `SourceCode`.
 * @param comment An ESLint comment token.
 * @returns Whether only whitespace shares the comment's first and last line.
 */
export function standsAlone(sourceCode: SourceCode, comment: TSESTree.Comment): boolean {
  const before = sourceCode.lines[comment.loc.start.line - 1]!.slice(0, comment.loc.start.column);
  const after = sourceCode.lines[comment.loc.end.line - 1]!.slice(comment.loc.end.column);

  return before.trim() === '' && after.trim() === '';
}

/**
 * Groups consecutive full-line `//` comments at the same indentation into runs.
 * @param sourceCode The rule's `SourceCode`.
 * @returns Arrays of line comments. Directives end a run and are never part of one.
 */
export function lineCommentRuns(sourceCode: SourceCode): TSESTree.Comment[][] {
  const runs: TSESTree.Comment[][] = [];
  let current: TSESTree.Comment[] = [];

  for (const comment of sourceCode.getAllComments()) {
    const joins = isRunCandidate(sourceCode, comment) && continuesRun(current, comment);
    if (!joins) {
      pushRun(runs, current);
      current = isRunCandidate(sourceCode, comment) ? [comment] : [];
      continue;
    }

    current.push(comment);
  }

  pushRun(runs, current);

  return runs;
}

/**
 * @param comment An ESLint comment token.
 * @returns The comment text without `//`, `/*`, `*\/` or leading `*` gutters, one entry per line.
 */
export function commentLines(comment: TSESTree.Comment): string[] {
  return comment.value
    .split('\n')
    .map((line) => line.replace(/^\s*\*?\s?/, '').trimEnd())
    .filter((line, index, lines) => line !== '' || (index > 0 && index < lines.length - 1));
}

function isRunCandidate(sourceCode: SourceCode, comment: TSESTree.Comment): boolean {
  return comment.type === 'Line' && !isDirective(comment) && standsAlone(sourceCode, comment);
}

function continuesRun(run: TSESTree.Comment[], comment: TSESTree.Comment): boolean {
  const last = run.at(-1);
  return (
    last !== undefined &&
    last.loc.start.line + 1 === comment.loc.start.line &&
    last.loc.start.column === comment.loc.start.column
  );
}

function pushRun(runs: TSESTree.Comment[][], run: TSESTree.Comment[]): void {
  if (run.length > 0) {
    runs.push(run);
  }
}

const PROSE_MARKER = /^(TODO|FIXME|HACK|NOTE|XXX|REVIEW)\b|^https?:\/\//i;
const TRIVIAL_EXPRESSIONS = new Set(['Identifier', 'Literal', 'MemberExpression', 'TemplateLiteral', 'ThisExpression']);

/**
 * Heuristic used by several comment rules: text "looks like code" when it parses as TypeScript and is
 * more than a bare word or label, which ordinary prose never does.
 * @param text Comment text without comment markers.
 * @returns Whether the text is probably commented-out code.
 */
export function looksLikeCode(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed === '' || PROSE_MARKER.test(trimmed)) return false;

  let program: TSESTree.Program;

  try {
    program = parse(trimmed, { ecmaVersion: 'latest', sourceType: 'module' });
  } catch {
    return false;
  }

  return program.body.length > 0 && !program.body.every(isTrivialStatement);
}

/**
 * Splits all non-directive comments into units: runs of full-line `//` comments, and every other
 * comment on its own.
 * @param sourceCode The rule's `SourceCode`.
 * @returns Arrays of comments, each array one logical comment.
 */
export function commentUnits(sourceCode: SourceCode): TSESTree.Comment[][] {
  const runs = lineCommentRuns(sourceCode);
  const inRun = new Set(runs.flat());
  const singles = sourceCode
    .getAllComments()
    .filter((comment) => !inRun.has(comment) && !isDirective(comment))
    .map((comment) => [comment]);

  return [...runs, ...singles];
}

/**
 * @param unit Comments of one logical comment.
 * @returns The unit's text, one line per comment line, without markers.
 */
export function unitText(unit: readonly TSESTree.Comment[]): string {
  return unit
    .flatMap((comment) => (comment.type === 'Line' ? [comment.value.replace(/^ /, '')] : commentLines(comment)))
    .join('\n');
}

function isTrivialStatement(statement: TSESTree.ProgramStatement): boolean {
  if (statement.type === 'LabeledStatement' || statement.type === 'EmptyStatement') return true;

  return statement.type === 'ExpressionStatement' && TRIVIAL_EXPRESSIONS.has(statement.expression.type);
}
