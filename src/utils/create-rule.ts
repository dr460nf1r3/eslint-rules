import { ESLintUtils } from '@typescript-eslint/utils';

/** Presets from lightest to strictest. Every preset contains the rules of the presets before it. */
export const PRESETS = ['lite', 'recommended', 'full'] as const;

export type Preset = (typeof PRESETS)[number];

export interface RuleDocs {
  /** The lightest preset that enables the rule. Rules without one are only in `full`. */
  preset?: Exclude<Preset, 'full'>;
  /** Frameworks or libraries whose code the rule targets, shown in the rule list. */
  frameworks?: readonly string[];
}

export const REPOSITORY_URL = 'https://github.com/dr460nf1r3/eslint-rules';

export const createRule = ESLintUtils.RuleCreator<RuleDocs>(
  (ruleName) => `${REPOSITORY_URL}/blob/main/docs/rules/${ruleName}.md`,
);
