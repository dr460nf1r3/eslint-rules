import stylistic from '@stylistic/eslint-plugin';
import type { Linter } from 'eslint';
import type { Preset } from '../utils/create-rule.js';

type Rules = Linter.RulesRecord;

/** Core, typescript-eslint and stylistic rules each preset adds next to the plugin's own rules. */

/** The `@stylistic` plugin the presets register for `STYLISTIC`. */
export const stylisticPlugin = stylistic;

/** Stylistic rules set up to agree with Prettier (2 spaces, single quotes, semicolons, trailing commas, 1tbs). */
const STYLISTIC_BASE = stylistic.configs.customize({
  arrowParens: true,
  braceStyle: '1tbs',
  commaDangle: 'always-multiline',
  indent: 2,
  jsx: false,
  quoteProps: 'consistent',
  quotes: 'single',
  semi: true,
  severity: 'warn',
});

/**
 * Formatting that Prettier leaves alone: blank lines after blocks, `if` statements and loops (consecutive
 * `if` guards may stay together). Blank lines before `return` are the plugin's `blank-lines` rule. Rules Prettier owns (indentation, operator line breaks)
 * are off, and strings that contain a `'` may keep double quotes as Prettier writes them.
 */
export const STYLISTIC: Rules = {
  ...STYLISTIC_BASE.rules,
  '@stylistic/indent': 'off',
  '@stylistic/indent-binary-ops': 'off',
  '@stylistic/lines-between-class-members': 'off',
  '@stylistic/operator-linebreak': 'off',
  '@stylistic/quotes': ['warn', 'single', { allowTemplateLiterals: 'always', avoidEscape: true }],
  '@stylistic/padding-line-between-statements': [
    'warn',
    { blankLine: 'always', prev: ['block-like', 'if', 'for', 'while', 'do'], next: '*' },
    { blankLine: 'any', prev: 'if', next: 'if' },
  ],
};

/** One accepted form per construct, all autofixable. Applies to test files too. */
const SHAPES: Rules = {
  ...STYLISTIC,
  'arrow-body-style': ['warn', 'as-needed'],
  'object-shorthand': ['warn', 'always'],
  'prefer-template': 'warn',
  'no-else-return': ['warn', { allowElseIf: false }],
  '@typescript-eslint/array-type': ['warn', { default: 'array' }],
};

/** Small files and functions. Test files are exempt. */
export const SIZE_AND_STRUCTURE: Rules = {
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
