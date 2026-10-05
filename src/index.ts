import type { ESLint, Linter } from 'eslint';
import { createRequire } from 'node:module';
import { buildTypeChecked } from './configs/build.js';
import full from './configs/full.js';
import lite from './configs/lite.js';
import recommended from './configs/recommended.js';
import { rules } from './rules/index.js';

const { name, version } = createRequire(import.meta.url)('../package.json') as { name: string; version: string };

type ConfigName = 'lite' | 'recommended' | 'full' | 'type-checked';

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

export { rules };

export default plugin;
