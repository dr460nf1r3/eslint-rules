import type { ESLint, Linter } from 'eslint';
import tseslint from 'typescript-eslint';
import type { Preset } from '../utils/create-rule.js';
import { rules as allRules } from '../rules/index.js';
import { loadOptional } from './angular.js';
import { CORE_RULES, SIZE_AND_STRUCTURE, stylisticPlugin, TYPE_CHECKED_RULES } from './core-rules.js';

type Config = Linter.Config;
type Rules = Linter.RulesRecord;

export const PLUGIN_NAMESPACE = '@dr460nf1r3';

export const TS_FILES = ['**/*.ts', '**/*.tsx', '**/*.mts', '**/*.cts'];

/**
 * Angular templates: `*.component.html`, plus every `.html` under `src/app` (Angular CLI) or `src/lib`
 * (Nx libraries), where templates of suffix-less components live. Other HTML (fixtures, static pages)
 * is left alone.
 */
export const TEMPLATE_FILES = ['**/*.component.html', '**/src/app/**/*.html', '**/src/lib/**/*.html'];

export const TEMPLATE_IGNORES = [
  '**/index.html',
  '**/assets/**',
  '**/public/**',
  '**/fixtures/**',
  '**/__fixtures__/**',
];

export const TEST_FILES = [
  '**/*.spec.ts',
  '**/*.test.ts',
  '**/*.e2e-spec.ts',
  '**/*.e2e.ts',
  '**/test/**',
  '**/tests/**',
  '**/__tests__/**',
  '**/*-e2e/**',
  '**/e2e/**',
  '**/test-setup.ts',
];

export const IGNORED_FILES = ['**/*.d.ts'];

/**
 * Rules that also apply to test files, since specs are read as often as the code they test. Every
 * other plugin rule is about production code (size, DI, API contracts, comments) and is off in tests.
 */
const RULES_FOR_TESTS = new Set(['blank-lines', 'one-line-guard', 'class-member-order', 'decorator-order']);
/** Rules that only make sense in specific TypeScript files and are off everywhere else. */
const RULE_FILES: Record<string, string[]> = {
  'no-untranslated-text': ['**/*.component.ts', '**/*.routes.ts'],
};
/** Rules that also run on Angular templates when `@angular-eslint/template-parser` is installed. */
const TEMPLATE_RULES = new Set(['no-untranslated-text']);

export interface PresetRules {
  [ruleName: string]: Linter.RuleSeverity;
}

/**
 * Assembles a preset from the plugin rules it enables, the core rules of its tier and the file scoping
 * that every preset shares.
 * @param plugin The plugin object, registered under `@dr460nf1r3`.
 * @param preset The preset name, used for config names.
 * @param pluginRules Plugin rule names (without namespace) mapped to their severity.
 * @returns The flat config array.
 */
export function buildPreset(plugin: ESLint.Plugin, preset: Preset, pluginRules: PresetRules): Config[] {
  const namespaced = (name: string): string => `${PLUGIN_NAMESPACE}/${name}`;
  const entries = Object.entries(pluginRules);
  const scoped = entries.filter(([name]) => RULE_FILES[name]);
  const core = CORE_RULES[preset];
  const configs: Config[] = [
    baseConfig(plugin, preset),
    {
      name: `${PLUGIN_NAMESPACE}/${preset}`,
      files: TS_FILES,
      ignores: IGNORED_FILES,
      rules: {
        ...core.all,
        ...core.sources,
        ...Object.fromEntries(
          entries.filter(([name]) => !RULE_FILES[name]).map(([name, level]) => [namespaced(name), level]),
        ),
      },
    },
    ...scoped.map(([name, level]) => ({
      name: `${PLUGIN_NAMESPACE}/${preset}/${name}`,
      files: RULE_FILES[name],
      ignores: IGNORED_FILES,
      rules: { [namespaced(name)]: level },
    })),
    { ...testsConfig(plugin), name: `${PLUGIN_NAMESPACE}/${preset}/tests` },
  ];
  const templateConfig = templateRules(plugin, preset, entries);
  return templateConfig ? [...configs, templateConfig] : configs;
}

/**
 * Rule settings for test files: every production-only plugin rule and the size limits are off, and
 * `blank-lines` keeps setup and assertions apart. Spread it into your own config when your tests live
 * where `TEST_FILES` cannot see them, for example in an e2e project with its own ESLint config:
 * `{ files: ['**\/*.ts'], rules: testRules }`.
 */
export const testRules: Rules = {
  ...off([
    ...Object.keys(SIZE_AND_STRUCTURE),
    ...Object.keys(allRules)
      .filter((name) => !RULES_FOR_TESTS.has(name))
      .map((name) => `${PLUGIN_NAMESPACE}/${name}`),
  ]),
  [`${PLUGIN_NAMESPACE}/blank-lines`]: ['warn', { attachConnected: false }],
};

/** The relaxations for test files on their own, as shipped in every preset. */
export function testsConfig(plugin: ESLint.Plugin): Config {
  return {
    name: `${PLUGIN_NAMESPACE}/tests`,
    files: TEST_FILES,
    plugins: { [PLUGIN_NAMESPACE]: plugin },
    rules: testRules,
  };
}

/** The add-on config with rules that need type information. */
export function buildTypeChecked(plugin: ESLint.Plugin): Config[] {
  return [
    {
      name: `${PLUGIN_NAMESPACE}/type-checked`,
      files: TS_FILES,
      ignores: IGNORED_FILES,
      plugins: { [PLUGIN_NAMESPACE]: plugin, '@typescript-eslint': tseslint.plugin as unknown as ESLint.Plugin },
      rules: TYPE_CHECKED_RULES,
    },
  ];
}

function baseConfig(plugin: ESLint.Plugin, preset: Preset): Config {
  return {
    name: `${PLUGIN_NAMESPACE}/${preset}/base`,
    files: TS_FILES,
    ignores: IGNORED_FILES,
    plugins: {
      [PLUGIN_NAMESPACE]: plugin,
      '@typescript-eslint': tseslint.plugin as unknown as ESLint.Plugin,
      '@stylistic': stylisticPlugin as unknown as ESLint.Plugin,
    },
    languageOptions: { parser: tseslint.parser as Linter.Parser, sourceType: 'module' },
  };
}

/**
 * The plugin's own template rules. Needs `@angular-eslint/template-parser`. Without it, templates are
 * not linted.
 */
function templateRules(
  plugin: ESLint.Plugin,
  preset: Preset,
  entries: [string, Linter.RuleSeverity][],
): Config | undefined {
  const own = entries.filter(([name]) => TEMPLATE_RULES.has(name));
  const parser = loadOptional<Linter.Parser>('@angular-eslint/template-parser');
  if (own.length === 0 || !parser) return undefined;

  return {
    name: `${PLUGIN_NAMESPACE}/${preset}/templates`,
    files: TEMPLATE_FILES,
    ignores: TEMPLATE_IGNORES,
    plugins: { [PLUGIN_NAMESPACE]: plugin },
    languageOptions: { parser },
    rules: Object.fromEntries(own.map(([name, level]) => [`${PLUGIN_NAMESPACE}/${name}`, level])),
  };
}

function off(ruleNames: string[]): Rules {
  return Object.fromEntries(ruleNames.map((name) => [name, 'off']));
}
