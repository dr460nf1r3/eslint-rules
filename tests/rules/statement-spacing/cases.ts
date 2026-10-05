import type { InvalidTestCase, ValidTestCase } from '@typescript-eslint/rule-tester';
import type { MessageIds, Options } from '../../../src/rules/statement-spacing.js';

const body = (...lines: string[]): string =>
  `function f() {\n${lines.map((line) => (line ? `  ${line}` : '')).join('\n')}\n}`;

export const valid: readonly ValidTestCase<Options>[] = [
  {
    name: 'keeps consecutive guards together and separates the group from what follows',
    code: body('if (!user) return;', 'if (!company) return;', '', 'load(user);', 'done();'),
  },
  {
    name: 'keeps a declaration next to the guard or loop that reads it',
    code: body(
      'const match = rows.find(isOpen);',
      'if (!match) return;',
      '',
      'const lines = load();',
      'for (const line of lines) {',
      '  use(line);',
      '}',
    ),
  },
  {
    name: 'keeps a declaration next to a multi-line call that reads it',
    code: body('const user = request.user;', 'await load(', '  user,', ');'),
  },
  {
    name: 'wins over the multi-line rule',
    code: body('const match = rows.find(', '  (row) => row.open,', ');', 'if (!match) return;'),
  },
  {
    name: 'accepts a block as first and last statement',
    code: body('for (const x of xs) {', '  use(x);', '}'),
  },
  {
    name: 'leaves the gap before a declaration group to the author',
    code: body('start();', 'const a = 1;', '', 'use(b);'),
  },
  {
    name: 'leaves consecutive one-line expression statements to the author',
    code: body('a();', 'b();', '', 'c();'),
  },
  {
    name: 'groups one-line fields and separates methods',
    code: 'class A {\n  a = 1;\n  b = 2;\n\n  m() {\n    return 1;\n  }\n\n  n() {\n    return 2;\n  }\n}',
  },
];

export const invalid: readonly InvalidTestCase<MessageIds, Options>[] = [
  {
    name: 'inserts a blank line after the last guard',
    code: body('if (!user) return;', 'load(user);'),
    output: body('if (!user) return;', '', 'load(user);'),
    errors: [{ messageId: 'blankRequired' }],
  },
  {
    name: 'removes a blank line between guards',
    code: body('if (!a) return;', '', 'if (!b) return;'),
    output: body('if (!a) return;', 'if (!b) return;'),
    errors: [{ messageId: 'blankForbidden' }],
  },
  {
    name: 'separates a guard group from an unrelated statement above it',
    code: body('start();', 'if (!a) return;'),
    output: body('start();', '', 'if (!a) return;'),
    errors: [{ messageId: 'blankRequired' }],
  },
  {
    name: 'removes a blank line between a declaration and the if that reads it',
    code: body('const a = get();', '', 'if (!a) return;'),
    output: body('const a = get();', 'if (!a) return;'),
    errors: [{ messageId: 'blankForbidden' }],
  },
  {
    name: 'requires a blank line when the if does not read the declaration',
    code: body('const a = get();', 'if (!b) return;'),
    output: body('const a = get();', '', 'if (!b) return;'),
    errors: [{ messageId: 'blankRequired' }],
  },
  {
    name: 'keeps a declaration next to any statement that reads it',
    code: body('const existing = list[0];', '', 'logger.debug(existing.code);', '', 'return existing;'),
    output: body('const existing = list[0];', 'logger.debug(existing.code);', '', 'return existing;'),
    errors: [{ messageId: 'blankForbidden' }],
  },
  {
    name: 'still separates a declaration from a statement that does not read it',
    code: body('const a = 1;', 'logger.debug(b);'),
    output: body('const a = 1;', '', 'logger.debug(b);'),
    errors: [{ messageId: 'blankRequired' }],
  },
  {
    name: 'only looks at the header, not at the body of the block',
    code: body('const a = get();', 'if (ready) {', '  use(a);', '}'),
    output: body('const a = get();', '', 'if (ready) {', '  use(a);', '}'),
    errors: [{ messageId: 'blankRequired' }],
  },
  {
    name: 'surrounds a multi-line if with blank lines',
    code: body('start();', 'if (a) {', '  b();', '}', 'end();'),
    output: body('start();', '', 'if (a) {', '  b();', '}', '', 'end();'),
    errors: [{ messageId: 'blankRequired' }, { messageId: 'blankRequired' }],
  },
  {
    name: 'treats try and switch as blocks',
    code: body('start();', 'try {', '  a();', '} catch {}', 'end();'),
    output: body('start();', '', 'try {', '  a();', '} catch {}', '', 'end();'),
    errors: [{ messageId: 'blankRequired' }, { messageId: 'blankRequired' }],
  },
  {
    name: 'keeps declarations together and separates the group',
    code: body('const user = request.user;', '', 'const limit = 50;', 'load();'),
    output: body('const user = request.user;', 'const limit = 50;', '', 'load();'),
    errors: [{ messageId: 'blankForbidden' }, { messageId: 'blankRequired' }],
  },
  {
    name: 'keeps a two-statement block compact',
    code: body('const gross = price * quantity;', '', 'return gross - discount;'),
    output: body('const gross = price * quantity;', 'return gross - discount;'),
    errors: [{ messageId: 'blankForbidden' }],
  },
  {
    name: 'separates the return of a longer block',
    code: body('const net = sumNet(lines);', 'const tax = sumTax(lines);', 'return net + tax;'),
    output: body('const net = sumNet(lines);', 'const tax = sumTax(lines);', '', 'return net + tax;'),
    errors: [{ messageId: 'blankRequired' }],
  },
  {
    name: 'surrounds a statement spanning several lines with blank lines',
    code: body('start();', 'await get(company, {', '  top: 50,', '});', 'end();'),
    output: body('start();', '', 'await get(company, {', '  top: 50,', '});', '', 'end();'),
    errors: [{ messageId: 'blankRequired' }, { messageId: 'blankRequired' }],
  },
  {
    name: 'keeps multi-line declarations in their declaration group',
    code: body('const fields = [', '  { model: header },', '];', '', 'const grids = [];', 'load();'),
    output: body('const fields = [', '  { model: header },', '];', 'const grids = [];', '', 'load();'),
    errors: [{ messageId: 'blankForbidden' }, { messageId: 'blankRequired' }],
  },
  {
    name: 'fixes gaps between fields and missing gaps between methods',
    code: 'class A {\n  a = 1;\n\n  b = 2;\n  m() {\n    return 1;\n  }\n}',
    output: 'class A {\n  a = 1;\n  b = 2;\n\n  m() {\n    return 1;\n  }\n}',
    errors: [{ messageId: 'blankForbidden' }, { messageId: 'blankRequired' }],
  },
  {
    name: 'separates injected dependencies from other members and keeps them together',
    code: 'class A {\n  private readonly http = inject(HttpClient);\n\n  private readonly router = inject(Router);\n  readonly loading = signal(false);\n}',
    output:
      'class A {\n  private readonly http = inject(HttpClient);\n  private readonly router = inject(Router);\n\n  readonly loading = signal(false);\n}',
    errors: [{ messageId: 'blankForbidden' }, { messageId: 'blankRequired' }],
  },
  {
    name: 'treats a decorated field on two lines as multi-line',
    code: 'class A {\n  a = 1;\n  @Input()\n  b = 2;\n}',
    output: 'class A {\n  a = 1;\n\n  @Input()\n  b = 2;\n}',
    errors: [{ messageId: 'blankRequired' }],
  },
  {
    name: 'moves a leading comment together with its statement',
    code: body('if (!a) return;', '// load the rest', 'load();'),
    output: body('if (!a) return;', '', '// load the rest', 'load();'),
    errors: [{ messageId: 'blankRequired' }],
  },
  {
    name: 'keeps a trailing comment on the previous line',
    code: body('if (!a) return; // nothing to do', 'load();'),
    output: body('if (!a) return; // nothing to do', '', 'load();'),
    errors: [{ messageId: 'blankRequired' }],
  },
  {
    name: 'never separates imports and re-exports, even multi-line ones',
    code: "import { a } from 'a';\n\nimport {\n  b,\n  c,\n} from 'b';\nexport {\n  d,\n} from 'd';\nconst x = 1;",
    output: "import { a } from 'a';\nimport {\n  b,\n  c,\n} from 'b';\nexport {\n  d,\n} from 'd';\n\nconst x = 1;",
    errors: [{ messageId: 'blankForbidden' }, { messageId: 'blankRequired' }],
  },
  {
    name: 'separates every exported declaration, even one-line ones',
    code: 'export const a = [\n  1,\n];\nexport const b = 2;\nexport const c = 3;\nconst d = 4;',
    output: 'export const a = [\n  1,\n];\n\nexport const b = 2;\n\nexport const c = 3;\n\nconst d = 4;',
    errors: [{ messageId: 'blankRequired' }, { messageId: 'blankRequired' }, { messageId: 'blankRequired' }],
  },
  {
    name: 'leaves blank lines to statement-spacing after reordering (class-member-order)',
    code: 'class A {\n  private readonly http = inject(HttpClient);\n  save() {\n    return 1;\n  }\n}',
    output: 'class A {\n  private readonly http = inject(HttpClient);\n\n  save() {\n    return 1;\n  }\n}',
    errors: [{ messageId: 'blankRequired' }],
  },
];
