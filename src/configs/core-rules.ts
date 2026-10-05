import type { Linter } from 'eslint';
import type { Preset } from '../utils/create-rule.js';

type Rules = Linter.RulesRecord;

/** Core and typescript-eslint rules each preset adds next to the plugin's own rules. */

/** One accepted form per construct, all autofixable. Applies to test files too. */
const SHAPES: Rules = {
  'arrow-body-style': ['warn', 'as-needed'],
  'object-shorthand': ['warn', 'always'],
  'prefer-template': 'warn',
  'no-else-return': ['warn', { allowElseIf: false }],
  '@typescript-eslint/array-type': ['warn', { default: 'array' }],
};
/** Small files and functions. Test files are exempt. */
const SIZE_AND_STRUCTURE: Rules = {
  'max-lines': ['warn', { max: 300, skipBlankLines: true, skipComments: true }],
  'max-lines-per-function': ['warn', { max: 40, skipBlankLines: true, skipComments: true }],
  'max-statements': ['warn', 15],
  'max-depth': ['warn', 3],
  'max-classes-per-file': ['warn', 1],
  'no-nested-ternary': 'warn',
};

export const CORE_RULES: Record<Preset, { all: Rules; sources: Rules }> = {
  lite: { all: SHAPES, sources: {} },
  recommended: { all: SHAPES, sources: SIZE_AND_STRUCTURE },
  full: { all: SHAPES, sources: SIZE_AND_STRUCTURE },
};

/** Rules that need type information (`parserOptions.projectService`), shipped as the `type-checked` add-on. */
export const TYPE_CHECKED_RULES: Rules = {
  '@typescript-eslint/prefer-optional-chain': 'warn',
  '@typescript-eslint/return-await': ['warn', 'in-try-catch'],
};
