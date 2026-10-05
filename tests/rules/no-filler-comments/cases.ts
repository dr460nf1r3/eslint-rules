import type { InvalidTestCase, ValidTestCase } from '@typescript-eslint/rule-tester';
import type { MessageIds, Options } from '../../../src/rules/no-filler-comments.js';

const FILLER = [
  '/** This function loads the draft. */',
  '// This method is a helper to map lines',
  '// Helper to build the clause',
  '// Simply map the lines',
  '// Basically the same mapping as B1 uses',
  '// Note that B1 rounds per line',
  '// It is important to call this first',
  '// In order to keep the order stable',
  '// We need to sort before paging',
  '// Here we map the lines',
];
const DIVIDERS = [
  '// ---------- Helpers ----------',
  '// ===========',
  '// Imports',
  '// Constructor',
  '// Lifecycle hooks:',
  '/* Getters */',
];

export const valid: readonly ValidTestCase<Options>[] = [
  {
    name: 'ignores quoted mentions of filler phrases',
    code: '// Reports "Note that" and `simply` as padding\nconst a = 1;',
  },
  {
    name: 'accepts plain explanatory comments',
    code: '// B1 rounds per line, not per document\nconst a = 1;',
  },
];

export const invalid: readonly InvalidTestCase<MessageIds, Options>[] = [
  ...FILLER.map((comment): InvalidTestCase<MessageIds, Options> => ({
    name: `reports filler phrasing: ${comment}`,
    code: `${comment}\nconst a = 1;`,
    errors: [{ messageId: 'filler' }],
  })),
  ...DIVIDERS.map((comment): InvalidTestCase<MessageIds, Options> => ({
    name: `reports divider and label comments: ${comment}`,
    code: `${comment}\nconst a = 1;`,
    errors: [{ messageId: 'divider' }],
  })),
];
