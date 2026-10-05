import type { InvalidTestCase, ValidTestCase } from '@typescript-eslint/rule-tester';
import type { MessageIds, Options } from '../../../src/rules/one-line-guard.js';

const longCondition =
  'invoice.lines.some((line) => line.taxCode === code && line.amount > threshold && !line.isFreeText)';

export const valid: readonly ValidTestCase<Options>[] = [
  {
    name: 'accepts one-line jumps, including returns with a value',
    code: 'function f(a, b) {\n  if (!a) return;\n  if (!b) return b.value;\n  for (const x of a) {\n    if (x) continue;\n    if (!x) break;\n  }\n  if (a === b) throw new Error("same");\n}',
  },
  {
    name: 'keeps a braced jump that would not fit on one line',
    code: `function f() {\n  if (${longCondition}) {\n    throw new ValidationException('too long for one line');\n  }\n}`,
  },
  {
    name: 'keeps a braced state change',
    code: 'if (dirty) {\n  save();\n}',
  },
  {
    name: 'ignores if/else, multi-statement bodies and bodies with comments',
    code: 'if (a) return 1;\nelse return 2;\nif (b) {\n  c();\n  return;\n}\nif (d) {\n  // keep the reason\n  return;\n}',
  },
];

export const invalid: readonly InvalidTestCase<MessageIds, Options>[] = [
  {
    name: 'collapses a braced jump that fits into one line',
    code: 'function f(a) {\n  if (!a) {\n    return null;\n  }\n}',
    output: 'function f(a) {\n  if (!a) return null;\n}',
    errors: [{ messageId: 'oneLine' }],
  },
  {
    name: 'collapses a jump that sits on its own line without braces',
    code: 'if (!a)\n  return;',
    output: 'if (!a) return;',
    errors: [{ messageId: 'oneLine' }],
  },
  {
    name: 'braces a jump whose one-line form exceeds the print width',
    code: 'if (!a) return;',
    options: [{ printWidth: 10 }],
    output: 'if (!a) {\n  return;\n}',
    errors: [{ messageId: 'braces' }],
  },
  {
    name: 'braces a one-line state change, keeping the indentation',
    code: 'function f() {\n  if (isExport) total += freight;\n}',
    output: 'function f() {\n  if (isExport) {\n    total += freight;\n  }\n}',
    errors: [{ messageId: 'braces' }],
  },
  {
    name: 'braces a jump whose returned value spans several lines',
    code: 'if (!a) return {\n  ok: false,\n};',
    output: 'if (!a) {\n  return {\n  ok: false,\n};\n}',
    errors: [{ messageId: 'braces' }],
  },
];
