import type { InvalidTestCase, ValidTestCase } from '@typescript-eslint/rule-tester';
import { readdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { rules } from '../src/rules/index.js';
import { PLUGIN_NAMESPACE } from '../src/configs/build.js';
import { CHECK, emit, finish, ROOT, ruleEntries, type RuleEntry } from './shared.js';

type Case = string | ValidTestCase<readonly unknown[]> | InvalidTestCase<string, readonly unknown[]>;

interface RuleModule {
  RULE_DOCS_EXTENSION?: { rationale?: string };
}

const entries = ruleEntries();
const known = new Set(entries.map((entry) => `${entry.name}.md`));

for (const file of readdirSync(path.join(ROOT, 'docs/rules'))) {
  if (known.has(file)) continue;

  if (CHECK) {
    console.error(`Stale rule doc: docs/rules/${file}`);
    process.exitCode = 1;
    continue;
  }

  rmSync(path.join(ROOT, 'docs/rules', file));
}

for (const entry of entries) {
  const ruleModule = (await import(pathToFileURL(path.join(ROOT, `src/rules/${entry.name}.ts`)).href)) as RuleModule;
  const cases = (await import(pathToFileURL(path.join(ROOT, `tests/rules/${entry.name}/cases.ts`)).href)) as {
    valid: readonly Case[];
    invalid: readonly Case[];
  };
  await emit(`docs/rules/${entry.name}.md`, ruleDoc(entry, ruleModule, cases), 'markdown');
}

finish('update-rule-docs');

function ruleDoc(
  entry: RuleEntry,
  ruleModule: RuleModule,
  cases: { valid: readonly Case[]; invalid: readonly Case[] },
): string {
  const rule = rules[entry.name as keyof typeof rules];
  const rationale = ruleModule.RULE_DOCS_EXTENSION?.rationale;
  return `<!--
  DO NOT EDIT. Generated from src/rules/${entry.name}.ts and tests/rules/${entry.name}/cases.ts.
  Run \`pnpm update-rule-docs\` to update it.
-->

# \`${PLUGIN_NAMESPACE}/${entry.name}\`

${entry.description}

- Type: ${entry.type}
- Presets: ${entry.presets.map((preset) => `\`${preset}\``).join(', ')}
${entry.fixable ? '- 🔧 Fixable with `--fix`\n' : ''}${entry.hasSuggestions ? '- 💡 Provides suggestions\n' : ''}${entry.docs.frameworks ? `- Targets: ${entry.docs.frameworks.join(', ')}\n` : ''}
${rationale ? `## Rationale\n\n${rationale}\n` : ''}
## Options

${optionsSection(rule.meta.schema, rule.defaultOptions ?? [])}

## Examples

These examples are the rule's test cases, so they match its current behaviour.

<details>
<summary>❌ Incorrect code</summary>

${cases.invalid.map(example).join('\n\n')}

</details>

<details>
<summary>✅ Correct code</summary>

${cases.valid.map(example).join('\n\n')}

</details>
`;
}

function optionsSection(schema: unknown, defaultOptions: readonly unknown[]): string {
  if (!Array.isArray(schema) || schema.length === 0) return 'The rule has no options.';

  return `\`\`\`json
${JSON.stringify(schema, null, 2)}
\`\`\`

Defaults:

\`\`\`json
${JSON.stringify(defaultOptions, null, 2)}
\`\`\``;
}

function example(testCase: Case): string {
  const normalized = typeof testCase === 'string' ? { code: testCase } : testCase;
  const language = normalized.filename?.endsWith('.html') ? 'html' : 'ts';
  const title = normalized.name ?? 'Example';
  const details = [
    normalized.filename ? `File: \`${normalized.filename}\`` : undefined,
    normalized.options?.length ? `Options: \`${JSON.stringify(normalized.options)}\`` : undefined,
  ].filter(Boolean);
  return `#### ${capitalize(title)}

${details.length > 0 ? `${details.join(' · ')}\n\n` : ''}\`\`\`${language}
${dedent(normalized.code)}
\`\`\``;
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function dedent(code: string): string {
  const lines = code.replace(/^\n+|\s+$/g, '').split('\n');
  const indent = Math.min(...lines.filter((line) => line.trim()).map((line) => line.match(/^ */)![0].length));
  return lines.map((line) => line.slice(indent)).join('\n');
}
