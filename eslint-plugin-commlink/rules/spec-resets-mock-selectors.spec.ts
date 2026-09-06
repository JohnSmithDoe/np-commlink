/* ─── why ─────────────────────────────────────────────────────────
 * The rule has no violations in the repo, so a working one and a dead one
 * print the same thing. Only these cases can tell them apart.
 *
 * The reset-after-override case is not decoration: the verdict is taken at
 * `Program:exit` precisely so a file may put the reset wherever it reads
 * best, and a rule that walked in source order would pass every real spec
 * while failing that one.
 * ───────────────────────────────────────────────────────────────── */

import { RuleTester } from 'eslint';
import { rule as specResetsMockSelectors } from './spec-resets-mock-selectors.ts';

const typescript = new RuleTester({
  languageOptions: { ecmaVersion: 2022, sourceType: 'module' },
});

typescript.run('spec-resets-mock-selectors', specResetsMockSelectors, {
  valid: [
    {
      code: `store.overrideSelector(selectThing, 1);
             afterEach(() => store.resetSelectors());`,
    },
    {
      code: `afterEach(() => store.resetSelectors());
             store.overrideSelector(selectThing, 1);`,
    },
    {
      code: `const seed = () => store.overrideSelector(selectThing, 1);
             afterEach(() => store.resetSelectors());`,
    },
    { code: 'expect(store.select(selectThing)).toBeTruthy();' },
  ],
  invalid: [
    {
      code: 'store.overrideSelector(selectThing, 1);',
      errors: [{ messageId: 'overrideWithoutReset' }],
    },
    {
      code: `store.overrideSelector(selectA, 1);
             store.overrideSelector(selectB, 2);`,
      errors: [
        { messageId: 'overrideWithoutReset' },
        { messageId: 'overrideWithoutReset' },
      ],
    },
  ],
});
