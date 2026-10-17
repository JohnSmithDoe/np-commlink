import { RuleTester } from 'eslint';
import { rule as instantArgumentIsMarker } from './instant-argument-is-marker.ts';

const typescript = new RuleTester({
  languageOptions: { ecmaVersion: 2022, sourceType: 'module' },
});

const inClass = (body: string): string =>
  `class Page { #translate; #storage; run() { ${body} } }`;

typescript.run('instant-argument-is-marker', instantArgumentIsMarker, {
  valid: [
    {
      code: inClass(
        "return this.#translate.instant(marker('cash.import.loading'));"
      ),
    },
    {
      code: inClass(
        'return this.#translate.get(message.key, message.parameters);'
      ),
    },
    {
      code: inClass(
        'return this.#translate.get([reminder.titleKey, reminder.bodyKey]);'
      ),
    },
    {
      code: inClass(
        "return this.#translate.get([marker('tasks.a'), marker('tasks.b')]);"
      ),
    },
    { code: inClass("return this.#storage.get('npc-cash');") },
    { code: "const id = route.snapshot.paramMap.get('id');" },
    { code: "const value = cache.stream('feed');" },
    { code: 'const text = this.translate.instant(TITLE);' },
    { code: 'const text = this.translate.instant();' },
  ],
  invalid: [
    {
      code: inClass("return this.#translate.instant('cash.import.loading');"),
      errors: [{ messageId: 'keyNeedsMarker' }],
    },
    {
      code: 'const text = clock.instant(`cash.kind.${kind}`);',
      errors: [{ messageId: 'keyNeedsMarker' }],
    },
    {
      code: "const text$ = this.translateService.get('tasks.title');",
      errors: [{ messageId: 'keyNeedsMarker' }],
    },
    {
      code: "const text$ = translate.stream('tasks.title');",
      errors: [{ messageId: 'keyNeedsMarker' }],
    },
    {
      code: inClass(
        "return this.#translate.get([marker('tasks.a'), 'tasks.b']);"
      ),
      errors: [{ messageId: 'keyNeedsMarker' }],
    },
  ],
});
