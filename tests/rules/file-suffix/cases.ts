import type { InvalidTestCase, ValidTestCase } from '@typescript-eslint/rule-tester';
import type { MessageIds, Options } from '../../../src/rules/file-suffix.js';

export const valid: readonly ValidTestCase<Options>[] = [
  {
    name: 'accepts matching suffixes',
    code: '@Component({}) export class InvoiceOutList {}',
    filename: 'src/app/invoice-out-list.component.ts',
  },
  {
    name: 'accepts matching suffixes (2)',
    code: `@Controller('x') export class WorkListController {}`,
    filename: 'src/app/work-list.controller.ts',
  },
  {
    name: 'accepts matching suffixes (3)',
    code: '@Service() export class InvoiceService {}',
    filename: 'src/app/invoice.service.ts',
  },
  {
    name: 'accepts matching suffixes (4)',
    code: 'export const routes: Routes = [];',
    filename: 'src/app/smart-docs.routes.ts',
  },
  {
    name: 'reports non-kebab-case basenames (3)',
    code: 'export {};',
    filename: 'src/app/index.ts',
  },
];

export const invalid: readonly InvalidTestCase<MessageIds, Options>[] = [
  {
    name: 'reports a decorator in a file without its suffix',
    code: '@Component({}) export class SudoContent {}',
    filename: 'src/app/sudo.content.ts',
    errors: [
      {
        messageId: 'wrongSuffix',
        data: { name: 'SudoContent', role: 'component', file: 'sudo.content.ts', stem: 'sudo' },
      },
    ],
  },
  {
    name: 'reports a decorator in a file without its suffix (2)',
    code: `@Controller('x') export class C {}`,
    filename: 'src/app/container-bom-controller.ts',
    errors: [{ messageId: 'wrongSuffix' }],
  },
  {
    name: 'reports a decorator in a file without its suffix (3)',
    code: 'export const routes: Routes = [];',
    filename: 'src/app/routes.ts',
    errors: [{ messageId: 'wrongSuffix' }],
  },
  {
    name: 'accepts suffix synonyms such as .route.ts for Routes only through .routes.ts',
    code: 'export const routes: Routes = [];',
    filename: 'src/app/bom.route.ts',
    errors: [{ messageId: 'wrongSuffix' }],
  },
  {
    name: 'reports a pipe class in a non-.pipe.ts file',
    code: 'export class ParseDocumentType implements PipeTransform {}',
    filename: 'src/app/parse.ts',
    errors: [{ messageId: 'wrongSuffix' }],
  },
  {
    name: 'reports non-kebab-case basenames',
    code: 'export {};',
    filename: 'libs/shared/src/lib/dashboard/APP_DASHBOARD.ts',
    errors: [{ messageId: 'notKebabCase', data: { file: 'APP_DASHBOARD.ts', kebab: 'app-dashboard.ts' } }],
  },
  {
    name: 'reports non-kebab-case basenames (2)',
    code: 'export {};',
    filename: 'libs/shared/src/lib/lab/labGroup.ts',
    errors: [{ messageId: 'notKebabCase', data: { file: 'labGroup.ts', kebab: 'lab-group.ts' } }],
  },
];
