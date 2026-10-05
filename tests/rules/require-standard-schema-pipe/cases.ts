import type { InvalidTestCase, ValidTestCase } from '@typescript-eslint/rule-tester';
import type { MessageIds, Options } from '../../../src/rules/require-standard-schema-pipe.js';

const MAIN = 'apps/api/src/main.ts';
const FIXTURES = 'tests/rules/require-standard-schema-pipe/fixtures';
const BOOTSTRAP = "import { AppModule } from './app.module';\nconst app = await NestFactory.create(AppModule);";

export const valid: readonly ValidTestCase<Options>[] = [
  {
    name: 'accepts a bootstrap that registers the pipe',
    code: 'const app = await NestFactory.create(AppModule); app.useGlobalPipes(new StandardSchemaValidationPipe());',
    filename: MAIN,
  },
  {
    name: 'ignores files that do not bootstrap Nest',
    code: 'bootstrapApplication(App);',
    filename: 'apps/shell/src/main.ts',
  },
  {
    name: 'accepts an APP_PIPE provider in a module the root module imports',
    code: BOOTSTRAP,
    filename: `${FIXTURES}/app-pipe/main.ts`,
  },
];

export const invalid: readonly InvalidTestCase<MessageIds, Options>[] = [
  {
    name: 'reports a bootstrap without the pipe',
    code: 'const app = await NestFactory.create(AppModule); app.useGlobalPipes(new ValidationPipe());',
    filename: MAIN,
    errors: [{ messageId: 'missingPipe' }],
  },
  {
    name: 'reports when the root module provides no APP_PIPE',
    code: BOOTSTRAP,
    filename: `${FIXTURES}/no-pipe/main.ts`,
    errors: [{ messageId: 'missingPipe' }],
  },
  {
    name: 'reports when the root module cannot be resolved',
    code: "import { AppModule } from './missing.module';\nconst app = await NestFactory.create(AppModule);",
    filename: `${FIXTURES}/no-pipe/main.ts`,
    errors: [{ messageId: 'missingPipe' }],
  },
];
