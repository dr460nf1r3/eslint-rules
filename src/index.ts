import type { ESLint, Linter } from 'eslint';
import { createRequire } from 'node:module';
import { buildAngular, buildAngularTypeChecked } from './configs/angular.js';
import {
  buildTypeChecked,
  TEMPLATE_FILES,
  TEMPLATE_IGNORES,
  TEST_FILES,
  testRules,
  testsConfig,
  TS_FILES,
} from './configs/build.js';
import full from './configs/full.js';
import lite from './configs/lite.js';
import recommended from './configs/recommended.js';
import { rules } from './rules/index.js';

const { name, version } = createRequire(import.meta.url)('../package.json') as { name: string; version: string };

type ConfigName = 'lite' | 'recommended' | 'full' | 'type-checked' | 'tests' | 'angular' | 'angular-type-checked';

export interface Plugin {
  meta: { name: string; version: string; namespace: string };
  rules: typeof rules;
  configs: Record<ConfigName, Linter.Config[]>;
}

const plugin: Plugin = {
  meta: { name, version, namespace: '@dr460nf1r3' },
  rules,
  configs: {} as Plugin['configs'],
};
const asPlugin = plugin as unknown as ESLint.Plugin;
plugin.configs.lite = lite(asPlugin);
plugin.configs.recommended = recommended(asPlugin);
plugin.configs.full = full(asPlugin);
plugin.configs['type-checked'] = buildTypeChecked(asPlugin);
plugin.configs.tests = [testsConfig(asPlugin)];

// The Angular configs load optional peer dependencies, so they are only built (and can only fail) when used.
Object.defineProperties(plugin.configs, {
  'angular': {
    enumerable: true,
    get: () => buildAngular({ ts: TS_FILES, templates: TEMPLATE_FILES, templateIgnores: TEMPLATE_IGNORES }),
  },
  'angular-type-checked': { enumerable: true, get: () => buildAngularTypeChecked(TS_FILES) },
});

/** Globs of the test files the presets relax rules for, to reuse in your own `files` and `ignores`. */
const testFiles: readonly string[] = TEST_FILES;

export { rules, testFiles, testRules };

export default plugin;
