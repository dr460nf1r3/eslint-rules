import { RuleTester } from '@typescript-eslint/rule-tester';
import { createRequire } from 'node:module';

const templateParser = createRequire(import.meta.url)('@angular-eslint/template-parser');

/** Rule tester for TypeScript sources, with decorators enabled. */
export function createRuleTester(): RuleTester {
  return new RuleTester({
    languageOptions: { parserOptions: { ecmaVersion: 'latest', sourceType: 'module' } },
  });
}

/** Rule tester for Angular templates, parsed with `@angular-eslint/template-parser`. */
export function createTemplateRuleTester(): RuleTester {
  return new RuleTester({ languageOptions: { parser: templateParser } });
}

/** Language options for a single template case inside a TypeScript rule tester. */
export const templateLanguageOptions = { parser: templateParser };
