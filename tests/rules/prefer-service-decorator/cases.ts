import type { InvalidTestCase, ValidTestCase } from '@typescript-eslint/rule-tester';
import type { MessageIds, Options } from '../../../src/rules/prefer-service-decorator.js';

export const valid: readonly ValidTestCase<Options>[] = [
  {
    name: 'ignores Nest @Injectable',
    code: `import { Injectable } from '@nestjs/common';\n@Injectable()\nclass S {}`,
  },
  {
    name: 'ignores Angular providers that need other options',
    code: `import { Injectable } from '@angular/core';\n@Injectable({ providedIn: 'root', useFactory: () => new X() })\nclass S {}`,
  },
];

export const invalid: readonly InvalidTestCase<MessageIds, Options>[] = [
  {
    name: 'reports and fixes @Injectable({ providedIn: "root" })',
    code: `import { inject, Injectable } from '@angular/core';\n@Injectable({ providedIn: 'root' })\nexport class InvoiceService {}`,
    output: `import { inject, Service } from '@angular/core';\n@Service()\nexport class InvoiceService {}`,
    errors: [{ messageId: 'useService' }],
  },
  {
    name: 'keeps the Injectable import when another class still uses it',
    code: `import { Injectable } from '@angular/core';\n@Injectable()\nclass A {}\n@Injectable({ providedIn: 'platform' })\nclass B {}`,
    output: `import { Injectable, Service } from '@angular/core';\n@Service()\nclass A {}\n@Injectable({ providedIn: 'platform' })\nclass B {}`,
    errors: [{ messageId: 'useService', line: 2 }],
  },
];
