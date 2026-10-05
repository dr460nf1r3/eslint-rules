import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { format, resolveConfig } from 'prettier';
import { rules } from '../src/rules/index.js';
import { PRESETS, type Preset, type RuleDocs } from '../src/utils/create-rule.js';

export const ROOT = fileURLToPath(new URL('../', import.meta.url));

export const CHECK = process.argv.includes('--check');

export interface RuleEntry {
  name: string;
  description: string;
  docs: RuleDocs;
  type: string;
  fixable: boolean;
  hasSuggestions: boolean;
  /** Presets that enable the rule. */
  presets: Preset[];
}

/** All rules sorted by name, with the presets that enable them. */
export function ruleEntries(): RuleEntry[] {
  return Object.entries(rules)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, rule]) => {
      const docs = rule.meta.docs as RuleDocs & { description: string };
      const lightest = PRESETS.indexOf(docs.preset ?? 'full');
      return {
        name,
        description: docs.description,
        docs,
        type: rule.meta.type,
        fixable: rule.meta.fixable !== undefined,
        hasSuggestions: rule.meta.hasSuggestions === true,
        presets: PRESETS.slice(lightest),
      };
    });
}

const outdated: string[] = [];

/**
 * Formats a generated file with Prettier and writes it, or with `--check` records it as outdated.
 * @param relativePath Path from the repository root.
 * @param content Unformatted content.
 * @param parser Prettier parser.
 */
export async function emit(relativePath: string, content: string, parser: 'typescript' | 'markdown'): Promise<void> {
  const file = path.join(ROOT, relativePath);
  const formatted = await format(content, { ...(await resolveConfig(file)), filepath: file, parser });
  const current = existsSync(file) ? readFileSync(file, 'utf8') : undefined;
  if (current === formatted) return;

  if (CHECK) {
    outdated.push(relativePath);
    return;
  }

  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, formatted);
  console.log(`updated ${relativePath}`);
}

/**
 * Ends a generator run. With `--check`, fails when a generated file is outdated.
 * @param command The script that regenerates the files.
 */
export function finish(command: string): void {
  if (outdated.length === 0) return;

  console.error(
    `Generated files are outdated:\n${outdated.map((file) => `  - ${file}`).join('\n')}\nRun \`pnpm ${command}\`.`,
  );

  process.exitCode = 1;
}
