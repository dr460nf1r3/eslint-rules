import type { ESLint, Linter } from 'eslint';
import { createRequire } from 'node:module';
import tseslint from 'typescript-eslint';
import type { Preset } from '../utils/create-rule.js';
import { CORE_RULES, TYPE_CHECKED_RULES } from './core-rules.js';

type Config = Linter.Config;
type Rules = Linter.RulesRecord;

export const PLUGIN_NAMESPACE = '@dr460nf1r3';

export const TS_FILES = ['**/*.ts', '**/*.tsx', '**/*.mts', '**/*.cts'];

export const TEMPLATE_FILES = ['**/*.html'];

export const TEST_FILES = [
  '**/*.spec.ts',
  '**/*.test.ts',
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
const RULES_FOR_TESTS = new Set(['one-line-guard', 'statement-spacing', 'class-member-order', 'decorator-order']);
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
  const testOff = entries.filter(([name]) => !RULES_FOR_TESTS.has(name)).map(([name]) => namespaced(name));
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
    {
      name: `${PLUGIN_NAMESPACE}/${preset}/tests`,
      files: TEST_FILES,
      rules: off([...Object.keys(core.sources), ...testOff]),
    },
  ];
  const templateConfig = templateRules(plugin, preset, entries);

  return templateConfig ? [...configs, templateConfig] : configs;
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
    plugins: { [PLUGIN_NAMESPACE]: plugin, '@typescript-eslint': tseslint.plugin as unknown as ESLint.Plugin },
    languageOptions: { parser: tseslint.parser as Linter.Parser, sourceType: 'module' },
  };
}

function templateRules(
  plugin: ESLint.Plugin,
  preset: Preset,
  entries: [string, Linter.RuleSeverity][],
): Config | undefined {
  const rules = entries.filter(([name]) => TEMPLATE_RULES.has(name));
  const parser = loadTemplateParser();
  if (rules.length === 0 || !parser) return undefined;

  return {
    name: `${PLUGIN_NAMESPACE}/${preset}/templates`,
    files: TEMPLATE_FILES,
    ignores: ['**/index.html'],
    plugins: { [PLUGIN_NAMESPACE]: plugin },
    languageOptions: { parser },
    rules: Object.fromEntries(rules.map(([name, level]) => [`${PLUGIN_NAMESPACE}/${name}`, level])),
  };
}

/** The template parser is an optional peer dependency. Without it, template checks are skipped. */
function loadTemplateParser(): Linter.Parser | undefined {
  try {
    return createRequire(import.meta.url)('@angular-eslint/template-parser') as Linter.Parser;
  } catch {
    return undefined;
  }
}

function off(ruleNames: string[]): Rules {
  return Object.fromEntries(ruleNames.map((name) => [name, 'off']));
}
