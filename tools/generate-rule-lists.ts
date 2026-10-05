import { readFileSync } from 'node:fs';
import path from 'node:path';
import { PRESETS } from '../src/utils/create-rule.js';
import { emit, finish, ROOT, ruleEntries, type RuleEntry } from './shared.js';

const BEGIN = '<!-- begin rule list -->';
const END = '<!-- end rule list -->';
const header = `| Rule | Description | ${PRESETS.map((preset) => `\`${preset}\``).join(' | ')} | Fix | Targets |
| --- | --- | ${PRESETS.map(() => ':-:').join(' | ')} | :-: | --- |`;
const rows = ruleEntries().map((entry) =>
  [
    `[\`${entry.name}\`](./docs/rules/${entry.name}.md)`,
    entry.description,
    ...PRESETS.map((preset) => (entry.presets.includes(preset) ? '✅' : '')),
    fixMarker(entry),
    entry.docs.frameworks?.join(', ') ?? '',
  ].join(' | '),
);

function fixMarker(entry: RuleEntry): string {
  if (entry.fixable) return '🔧';

  return entry.hasSuggestions ? '💡' : '';
}

const readme = readFileSync(path.join(ROOT, 'README.md'), 'utf8');
const start = readme.indexOf(BEGIN);
const end = readme.indexOf(END);
if (start === -1 || end === -1) throw new Error(`README.md needs ${BEGIN} and ${END} markers.`);

const table = [header, ...rows.map((row) => `| ${row} |`)].join('\n');
await emit('README.md', `${readme.slice(0, start + BEGIN.length)}\n\n${table}\n\n${readme.slice(end)}`, 'markdown');

finish('update-rule-lists');
