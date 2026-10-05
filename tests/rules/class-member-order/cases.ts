import type { InvalidTestCase, ValidTestCase } from '@typescript-eslint/rule-tester';
import type { MessageIds, Options } from '../../../src/rules/class-member-order.js';

const cls = (...lines: string[]): string =>
  `class A {\n${lines.map((line) => (line ? `  ${line}` : '')).join('\n')}\n}`;

export const valid: readonly ValidTestCase<Options>[] = [
  {
    name: 'accepts the full Angular order',
    code: cls(
      'static readonly KEY = "a";',
      'private readonly http = inject(HttpClient);',
      'protected readonly router = inject(Router);',
      'readonly code = input.required<string>();',
      'readonly saved = output<void>();',
      'readonly page = viewChild.required(PageComponent);',
      'readonly loading = signal(false);',
      'readonly title = computed(() => this.code());',
      'pageModel = new PageModel();',
      'constructor() {}',
      'ngOnInit() {}',
      'ngOnDestroy() {}',
      'save() {}',
      'protected cancel() {}',
      'private reset() {}',
    ),
  },
  {
    name: 'keeps the source order of same-rank members, so Nest routes and overloads stay put',
    code: cls(
      'constructor(private readonly s: S) {}',
      '@Get("list") list() {}',
      '@Get(":id") one() {}',
      'parse(a: string): void;',
      'parse(a: number): void;',
      'parse(a) {}',
    ),
  },
  {
    name: 'counts inject() inside a larger initializer as an inject field, like inject-at-top',
    code: cls(
      'private readonly env = inject(Config).environment;',
      'private readonly changes = toSignal(inject(Store).select(selectCart));',
      'private readonly api = (() => inject(ApiClient))();',
      'readonly loading = signal(false);',
    ),
  },
  {
    name: 'leaves inject() inside a callback to its outer call, since it runs later',
    code: cls('readonly loading = signal(false);', 'readonly user = computed(() => inject(Session).user());'),
  },
];

export const invalid: readonly InvalidTestCase<MessageIds, Options>[] = [
  {
    name: 'orders inject() fields by visibility, readonly first',
    code: cls(
      'readonly config = inject(Config);',
      'private store = inject(Store);',
      'private readonly http = inject(HttpClient);',
    ),
    output: cls(
      'private readonly http = inject(HttpClient);',
      'private store = inject(Store);',
      'readonly config = inject(Config);',
    ),
    errors: [{ messageId: 'outOfOrder' }],
  },
  {
    name: 'puts lifecycle hooks in framework order after the constructor',
    code: cls('ngOnDestroy() {}', 'constructor() {}', 'ngOnInit() {}'),
    output: cls('constructor() {}', 'ngOnInit() {}', 'ngOnDestroy() {}'),
    errors: [{ messageId: 'outOfOrder' }],
  },
  {
    name: 'classifies decorated inputs and queries',
    code: cls('@ViewChild("x") x;', '@Input() code: string;'),
    output: cls('@Input() code: string;', '@ViewChild("x") x;'),
    errors: [
      {
        messageId: 'outOfOrder',
        data: { name: 'code', group: 'input/output', other: 'x', otherGroup: 'query' },
      },
    ],
  },
  {
    name: 'moves leading and trailing comments with their member',
    code: cls('save() {} // persists', '/** The client. */', 'private readonly http = inject(HttpClient);'),
    output: cls('/** The client. */', 'private readonly http = inject(HttpClient);', 'save() {} // persists'),
    errors: [{ messageId: 'outOfOrder' }],
  },
  {
    name: 'does not fix when a field initialiser would read a field moved below it',
    code: cls('mode = 1;', 'model = new Model(this.mode);', 'readonly loading = signal(this.model.busy);'),
    output: null,
    errors: [{ messageId: 'outOfOrder' }],
  },
  {
    name: 'fixes when the read is lazy, inside a function',
    code: cls('mode = 1;', 'readonly loading = computed(() => this.mode === 1);'),
    output: cls('readonly loading = computed(() => this.mode === 1);', 'mode = 1;'),
    errors: [{ messageId: 'outOfOrder' }],
  },
  {
    name: 'leaves blank lines to the formatter after reordering',
    code: cls('save() {', '  return 1;', '}', 'private readonly http = inject(HttpClient);'),
    output: cls('private readonly http = inject(HttpClient);', 'save() {', '  return 1;', '}'),
    errors: [{ messageId: 'outOfOrder' }],
  },
  {
    name: 'moves inject(X).prop above signals',
    code: cls('readonly loading = signal(false);', 'private readonly env = inject(Config).environment;'),
    output: cls('private readonly env = inject(Config).environment;', 'readonly loading = signal(false);'),
    errors: [{ messageId: 'outOfOrder' }],
  },
  {
    name: 'moves a nested eager inject() above signals',
    code: cls('readonly loading = signal(false);', 'readonly cart = toSignal(inject(Store).select(selectCart));'),
    output: cls('readonly cart = toSignal(inject(Store).select(selectCart));', 'readonly loading = signal(false);'),
    errors: [{ messageId: 'outOfOrder' }],
  },
];
