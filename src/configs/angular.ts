import type { ESLint, Linter } from 'eslint';
import { createRequire } from 'node:module';

const ANGULAR = '@angular-eslint';
const ANGULAR_TEMPLATE = '@angular-eslint/template';
/** angular-eslint rules that `full` enables for TypeScript files. */
const ANGULAR_RULES = [
  'contextual-decorator',
  'inject-at-top',
  'no-async-lifecycle-method',
  'no-implicit-take-until-destroyed',
  'prefer-host-metadata-property',
  'prefer-output-emitter-ref',
  'prefer-output-readonly',
  'prefer-service-decorator',
  'relative-url-prefix',
  'use-injectable-provided-in',
  'use-pipe-transform-interface',
];
/** angular-eslint rules that read type information, shipped in the `type-checked` add-on. */
const ANGULAR_TYPED_RULES = [
  'no-uncalled-signals',
  'prefer-signal-model',
  'prefer-signals',
  'reactive-context-must-read-signal',
];
/** angular-eslint template rules that `full` enables for Angular templates. */
const ANGULAR_TEMPLATE_RULES = [
  'prefer-at-empty',
  'prefer-built-in-pipes',
  'prefer-class-binding',
  'prefer-control-flow',
  'prefer-self-closing-tags',
  'prefer-template-literal',
  'require-switch-default',
  'use-track-by-function',
];
const require = createRequire(import.meta.url);

/** Loads an optional peer dependency, or returns `undefined` when it is not installed. */
export function loadOptional<T>(name: string): T | undefined {
  try {
    return require(name) as T;
  } catch {
    return undefined;
  }
}

const angularPlugin = loadOptional<ESLint.Plugin>('@angular-eslint/eslint-plugin');
const angularTemplatePlugin = loadOptional<ESLint.Plugin>('@angular-eslint/eslint-plugin-template');

function namespaced(namespace: string, ruleNames: string[]): Linter.RulesRecord {
  return Object.fromEntries(ruleNames.map((name) => [`${namespace}/${name}`, 'warn']));
}

const MISSING =
  'needs `@angular-eslint/eslint-plugin`, `@angular-eslint/eslint-plugin-template` and `@angular-eslint/template-parser`. Install them as dev dependencies.';

/**
 * The opt-in `angular` config: angular-eslint's TypeScript and template rules. It is separate from the
 * presets because ESLint globs cannot tell Angular files from NestJS ones (`@Injectable()` exists in both),
 * so apply it to the Angular project only.
 * @throws When the angular-eslint packages are not installed.
 */
export function buildAngular(files: { ts: string[]; templates: string[]; templateIgnores: string[] }): Linter.Config[] {
  const parser = loadOptional<Linter.Parser>('@angular-eslint/template-parser');
  if (!angularPlugin || !angularTemplatePlugin || !parser) throw new Error(`configs.angular ${MISSING}`);

  return [
    {
      name: '@dr460nf1r3/angular',
      files: files.ts,
      ignores: ['**/*.d.ts'],
      plugins: { [ANGULAR]: angularPlugin },
      rules: namespaced(ANGULAR, ANGULAR_RULES),
    },
    {
      name: '@dr460nf1r3/angular/templates',
      files: files.templates,
      ignores: files.templateIgnores,
      plugins: { [ANGULAR_TEMPLATE]: angularTemplatePlugin },
      languageOptions: { parser },
      rules: namespaced(ANGULAR_TEMPLATE, ANGULAR_TEMPLATE_RULES),
    },
  ];
}

/**
 * The opt-in `angular-type-checked` config: angular-eslint's signal rules, which read type information.
 * @throws When `@angular-eslint/eslint-plugin` is not installed.
 */
export function buildAngularTypeChecked(files: string[]): Linter.Config[] {
  if (!angularPlugin) throw new Error(`configs['angular-type-checked'] ${MISSING}`);

  return [
    {
      name: '@dr460nf1r3/angular-type-checked',
      files,
      ignores: ['**/*.d.ts'],
      plugins: { [ANGULAR]: angularPlugin },
      rules: namespaced(ANGULAR, ANGULAR_TYPED_RULES),
    },
  ];
}
