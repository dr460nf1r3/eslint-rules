import { ESLint } from 'eslint';
import { readdirSync } from 'node:fs';
import plugin, { testFiles, testRules } from '../src/index.js';

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
    expect(severity(config.rules['@stylistic/padding-line-between-statements'])).toBe(1);
  });

  it.each(['apps/api/test/app.e2e-spec.ts', 'src/total.spec.ts', 'apps/shop-e2e/src/checkout.ts'])(
    'relaxes production-only rules in %s',
    async (file) => {
      const eslint = new ESLint({ overrideConfigFile: true, overrideConfig: plugin.configs.full });
      const config = (await eslint.calculateConfigForFile(file)) as { rules: Record<string, unknown> };
      expect(severity(config.rules['@dr460nf1r3/max-params'])).toBe(0);
    },
  );

  it('exports the test relaxations for configs whose tests sit outside the test globs', async () => {
    expect(testRules['@dr460nf1r3/max-params']).toBe('off');
    expect(testRules['max-lines-per-function']).toBe('off');
    expect(testRules['@dr460nf1r3/one-line-guard']).toBeUndefined();

    const eslint = new ESLint({
      overrideConfigFile: true,
      overrideConfig: [...plugin.configs.full, { ...plugin.configs.tests[0], files: ['**/*.ts'] }],
    });
    const config = (await eslint.calculateConfigForFile('src/checkout.ts')) as { rules: Record<string, unknown> };
    expect(severity(config.rules['@dr460nf1r3/max-params'])).toBe(0);
  });

  it('lints Angular templates only, not every HTML file', async () => {
    const eslint = new ESLint({ overrideConfigFile: true, overrideConfig: plugin.configs.full });
    const linted = async (file: string): Promise<boolean> => (await eslint.calculateConfigForFile(file)) !== undefined;
    expect(await linted('src/app/cart/cart.html')).toBe(true);
    expect(await linted('libs/ui/src/lib/button/button.component.html')).toBe(true);
    expect(await linted('tests/fixtures/report.html')).toBe(false);
    expect(await linted('public/landing.html')).toBe(false);
    expect(await linted('src/index.html')).toBe(false);
  });

  it('keeps angular-eslint rules out of the presets and in the opt-in angular configs', () => {
    const rulesOf = (configs: { rules?: object }[]): string[] =>
      configs.flatMap((config) => Object.keys(config.rules ?? {}));

    for (const name of ['lite', 'recommended', 'full', 'type-checked'] as const) {
      expect(rulesOf(plugin.configs[name]).filter((rule) => rule.startsWith('@angular-eslint/'))).toEqual([]);
    }

    expect(rulesOf(plugin.configs.angular)).toEqual(
      expect.arrayContaining(['@angular-eslint/inject-at-top', '@angular-eslint/template/prefer-control-flow']),
    );

    expect(rulesOf(plugin.configs['angular-type-checked'])).toContain('@angular-eslint/prefer-signals');
  });

  it('leaves a NestJS service alone under full', async () => {
    const eslint = new ESLint({ overrideConfigFile: true, overrideConfig: plugin.configs.full });
    const [result] = await eslint.lintText(
      "import { Injectable } from '@nestjs/common';\n\n@Injectable()\nexport class MailService {}\n",
      { filePath: 'apps/api/src/mail.service.ts' },
    );
    expect(result!.messages.map((message) => message.ruleId)).toEqual([]);
  });

  it('exports the test globs the presets use', () => {
    expect(testFiles).toEqual(expect.arrayContaining(['**/*.spec.ts', '**/test/**', '**/*.e2e-spec.ts']));
    expect(plugin.configs.tests[0]!.files).toEqual(testFiles);
  });

  it('requires blank lines after blocks, ifs and loops, lets if guards stack and keeps a return on its declaration', async () => {
    const eslint = new ESLint({ overrideConfigFile: true, overrideConfig: plugin.configs.lite });
    const code = [
      'export function total(items: number[], limit: number): number {',
      '  if (!items.length) return 0;',
      '  if (limit < 0) return 0;',
      '  let sum = 0;',
      '  for (const item of items) sum += item;',
      '  while (sum > limit) sum -= limit;',
      '  const rounded = Math.round(sum);',
      '  return rounded;',
      '}',
      '',
    ].join('\n');
    const [result] = await eslint.lintText(code, { filePath: 'src/total.ts' });
    const spacing = result!.messages.filter((message) =>
      ['@stylistic/padding-line-between-statements', '@dr460nf1r3/blank-lines'].includes(message.ruleId ?? ''),
    );
    expect(spacing.map((message) => message.line)).toEqual([4, 6, 7]);
  });
});
