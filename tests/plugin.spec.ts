import { ESLint } from 'eslint';
import { readdirSync } from 'node:fs';
import plugin from '../src/index.js';

const ruleFiles = readdirSync(new URL('../src/rules/', import.meta.url))
  .filter((file) => file !== 'index.ts')
  .map((file) => file.replace(/\.ts$/, ''));
const testDirs = readdirSync(new URL('./rules/', import.meta.url));

function enabledRules(name: 'lite' | 'recommended' | 'full'): string[] {
  return plugin.configs[name]
    .flatMap((config) => Object.entries(config.rules ?? {}))
    .filter(([rule, level]) => rule.startsWith('@dr460nf1r3/') && level !== 'off')
    .map(([rule]) => rule.replace('@dr460nf1r3/', ''));
}

function severity(entry: unknown): unknown {
  return Array.isArray(entry) ? entry[0] : entry;
}

describe('plugin', () => {
  it('exports every rule file under its file name', () => {
    expect(Object.keys(plugin.rules).sort()).toEqual(ruleFiles.sort());
  });

  it('has tests for every rule', () => {
    expect(testDirs.sort()).toEqual(ruleFiles.sort());
  });

  it('nests the presets: lite in recommended in full', () => {
    const [lite, recommended, full] = (['lite', 'recommended', 'full'] as const).map(
      (name) => new Set(enabledRules(name)),
    );
    expect([...lite!].filter((rule) => !recommended!.has(rule))).toEqual([]);
    expect([...recommended!].filter((rule) => !full!.has(rule))).toEqual([]);
    expect([...full!].sort()).toEqual(ruleFiles.sort());
  });

  it.each(['lite', 'recommended', 'full'] as const)('lints a file with the %s preset', async (name) => {
    const eslint = new ESLint({ overrideConfigFile: true, overrideConfig: plugin.configs[name] });
    const [result] = await eslint.lintText('export const total = (a: number, b: number) => a + b;\n', {
      filePath: 'src/total.ts',
    });
    expect(result!.messages).toEqual([]);
  });

  it('turns production-only rules off in tests', async () => {
    const eslint = new ESLint({ overrideConfigFile: true, overrideConfig: plugin.configs.full });
    const config = (await eslint.calculateConfigForFile('src/total.spec.ts')) as { rules: Record<string, unknown> };
    expect(severity(config.rules['@dr460nf1r3/max-params'])).toBe(0);
    expect(severity(config.rules['@dr460nf1r3/statement-spacing'])).toBe(1);
  });
});
