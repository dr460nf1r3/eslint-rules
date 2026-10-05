<!--
  DO NOT EDIT. Generated from src/rules/no-new-service.ts and tests/rules/no-new-service/cases.ts.
  Run `pnpm update-rule-docs` to update it.
-->

# `@dr460nf1r3/no-new-service`

Inject collaborators instead of constructing them (dependency inversion)

- Type: suggestion
- Presets: `recommended`, `full`
- Targets: Angular, NestJS

## Rationale

A collaborator built with `new` inside a DI-created class is a hidden, concrete dependency: it cannot be mocked in tests, replaced through DI or configured centrally. Names ending in Service, Repository, Client or Gateway are treated as collaborators; value objects, exceptions and construction outside DI classes (factories, bootstrap code) are left alone.

## Options

The rule has no options.

## Examples

These examples are the rule's test cases, so they match its current behaviour.

<details>
<summary>❌ Incorrect code</summary>

#### Reports constructing a service inside an injectable class

```ts
@Injectable() class InvoiceService { private mail = new MailService(); }
```

#### Reports repositories and clients inside components

```ts
@Component({}) class C { load() { return new InvoiceRepository().all(new ApiClient()); } }
```

</details>

<details>
<summary>✅ Correct code</summary>

#### Accepts value objects and exceptions

```ts
@Injectable() class S { run() { new Money(1); throw new NotFoundException({}); } }
```

#### Accepts construction outside DI classes, e.g. in a factory or bootstrap

```ts
export const service = new MailService();
```

</details>
