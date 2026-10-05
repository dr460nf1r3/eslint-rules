import type { TSESTree } from '@typescript-eslint/utils';

/**
 * Word helpers for comparing comment prose with the code next to it. Verbs are folded into concept
 * classes ("Returns", "fetches" and "loads" all become `get`) so a comment that restates the code
 * with a synonym still matches.
 */

const STOPWORDS = new Set([
  'a',
  'an',
  'the',
  'to',
  'of',
  'for',
  'and',
  'or',
  'is',
  'are',
  'be',
  'this',
  'that',
  'it',
  'its',
  'with',
  'in',
  'on',
  'by',
  'as',
  'at',
  'from',
  'into',
  'all',
  'over',
  'given',
  'new',
  'specified',
  'provided',
  'current',
  'then',
]);
const CONCEPTS: Record<string, string[]> = {
  get: [
    'get',
    'gets',
    'fetch',
    'fetches',
    'retrieve',
    'retrieves',
    'load',
    'loads',
    'read',
    'reads',
    'obtain',
    'obtains',
    'return',
    'returns',
  ],
  set: [
    'set',
    'sets',
    'assign',
    'assigns',
    'store',
    'stores',
    'update',
    'updates',
    'reset',
    'resets',
    'init',
    'initialize',
    'initializes',
    'initialise',
  ],
  create: ['create', 'creates', 'build', 'builds', 'make', 'makes', 'generate', 'generates', 'construct', 'constructs'],
  check: ['check', 'checks', 'verify', 'verifies', 'validate', 'validates', 'whether', 'if', 'is', 'has'],
  loop: ['loop', 'loops', 'iterate', 'iterates', 'each', 'every', 'for', 'foreach', 'while'],
  remove: ['remove', 'removes', 'delete', 'deletes', 'clear', 'clears'],
  call: ['call', 'calls', 'invoke', 'invokes', 'run', 'runs', 'execute', 'executes'],
};
const CONCEPT_OF = new Map(
  Object.entries(CONCEPTS).flatMap(([concept, words]) => words.map((word) => [word, concept])),
);
/**
 * Concepts implied by code punctuation and keywords rather than by identifier names.
 */
const TOKEN_CONCEPTS = new Map<string, string[]>([
  ['=', ['set', 'get']],
  ['+=', ['set']],
  ['-=', ['set']],
  ['++', ['set']],
  ['--', ['set']],
  ['??=', ['set']],
  ['||=', ['set']],
  ['if', ['check']],
  ['?', ['check']],
  ['===', ['check']],
  ['!==', ['check']],
  ['switch', ['check']],
  ['for', ['loop']],
  ['while', ['loop']],
  ['return', ['get']],
  ['await', ['call']],
  ['new', ['create']],
  ['(', ['call']],
]);
const ABBREVIATIONS = new Map<string, string>([
  ['num', 'number'],
  ['nr', 'number'],
  ['no', 'number'],
  ['qty', 'quantity'],
  ['amt', 'amount'],
  ['desc', 'description'],
  ['cfg', 'configuration'],
  ['config', 'configuration'],
  ['db', 'database'],
  ['doc', 'document'],
  ['msg', 'message'],
  ['idx', 'index'],
  ['btn', 'button'],
  ['val', 'value'],
  ['str', 'string'],
  ['arr', 'array'],
  ['obj', 'object'],
  ['err', 'error'],
  ['req', 'request'],
  ['res', 'response'],
  ['param', 'parameter'],
  ['id', 'identifier'],
]);

export const WHY_WORDS =
  /\b(because|since|so that|otherwise|avoid|prevent|workaround|hack|bug|must|needs?|required?|instead|in case|due to|why|unless|only when|quirk)\b/i;

/**
 * @param name An identifier such as `getInvoiceLines` or `MAX_PAGE_SIZE`.
 * @returns Its words as normalized concepts.
 */
export function identifierWords(name: string): string[] {
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map(normalize);
}

/**
 * @param text Comment prose.
 * @returns Its meaningful words as normalized concepts, without stopwords.
 */
export function proseWords(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word && !STOPWORDS.has(word))
    .map(normalize);
}

/**
 * @param tokens ESLint tokens of a statement.
 * @returns Every concept the code expresses, from identifiers, keywords and operators.
 */
export function codeWords(tokens: readonly TSESTree.Token[]): Set<string> {
  const words = new Set<string>();

  for (const token of tokens) {
    for (const concept of TOKEN_CONCEPTS.get(token.value) ?? []) {
      words.add(concept);
    }

    if (token.type === 'Identifier' || token.type === 'Keyword' || token.type === 'Boolean' || token.type === 'Null') {
      identifierWords(token.value).forEach((word) => words.add(word));
    }
  }

  return words;
}

/**
 * @param words Prose words.
 * @param known Words the code already says.
 * @returns The share of prose words the code already says, from 0 to 1.
 */
export function coverage(words: readonly string[], known: ReadonlySet<string>): number {
  if (words.length === 0) return 0;

  return words.filter((word) => known.has(word)).length / words.length;
}

function normalize(word: string): string {
  const lower = ABBREVIATIONS.get(word.toLowerCase()) ?? word.toLowerCase();
  if (CONCEPT_OF.has(lower)) return CONCEPT_OF.get(lower)!;

  return lower.length > 3 && lower.endsWith('s') && !lower.endsWith('ss') ? lower.slice(0, -1) : lower;
}
