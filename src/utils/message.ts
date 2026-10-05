/**
 * Builds a rule message in the "what / Why / How to fix" shape, so an agent reading lint output
 * gets the reason and a concrete next step instead of just the violation.
 * @param parts Message parts, which may contain `{{placeholders}}`.
 * @returns The message template.
 */
export function guidance({ problem, why, fix }: { problem: string; why: string; fix: string }): string {
  return `${problem}\n\nWhy: ${why}\n\nHow to fix: ${fix}`;
}
