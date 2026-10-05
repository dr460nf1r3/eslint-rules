import type { InvalidTestCase, ValidTestCase } from '@typescript-eslint/rule-tester';
import type { MessageIds, Options } from '../../../src/rules/require-standard-schema-pipe.js';

const MAIN = 'apps/api/src/main.ts';

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
];

export const invalid: readonly InvalidTestCase<MessageIds, Options>[] = [
  {
    name: 'reports a bootstrap without the pipe',
    code: 'const app = await NestFactory.create(AppModule); app.useGlobalPipes(new ValidationPipe());',
    filename: MAIN,
    errors: [{ messageId: 'missingPipe' }],
  },
];
