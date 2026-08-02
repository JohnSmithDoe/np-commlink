/* ─── why ─────────────────────────────────────────────────────────
 * An `index.ts` is a `<domain>/data/` facade barrel, or it should not
 * exist. The layout is barrel-less by decision (`enableBarrelLess` in
 * sheriff.config.ts) with exactly one exception: `<domain>/data/index.ts`
 * publishes the domain's facade, and Sheriff enforces that outside code
 * goes through it rather than deep-importing the reducer. Everywhere else
 * a barrel costs the thing the barrel-less layout buys — an import line
 * that names the concern it depends on (`…/model/recipe.types`) rather
 * than the folder it lives in.
 *
 * Sheriff cannot catch a new one: `enableBarrelLess` governs how imports
 * RESOLVE, not whether a file gets created, so a fresh `model/index.ts` is
 * simply a new module Sheriff tags and permits. This rule is the creation
 * half, which is why the finding is reported on `Program` — it is about
 * the file's existence rather than anything in it.
 * ───────────────────────────────────────────────────────────────── */

import type { Rule } from 'eslint';

const DATA_BARREL = /(?:^|\/)src\/app\/[^/]+\/data\/index\.ts$/;
const ANY_BARREL = /(?:^|\/)index\.ts$/;

export const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'The only barrel is <domain>/data/index.ts; every other layer is barrel-less so an import names its concern.',
    },
    schema: [],
    messages: {
      unexpectedBarrel:
        'The only sanctioned barrel is `<domain>/data/index.ts`, which publishes the domain facade. Everywhere else the layout is barrel-less on purpose, so an import line names the concern it depends on (`…/model/recipe.types`) instead of a folder. Sheriff will not catch this — `enableBarrelLess` governs how imports resolve, not whether a barrel exists. Delete it and import the files directly.',
    },
  },
  create(context) {
    const filename = context.filename.replaceAll('\\', '/');
    if (!ANY_BARREL.test(filename)) return {};
    if (DATA_BARREL.test(filename)) return {};

    return {
      Program(node) {
        context.report({ node, messageId: 'unexpectedBarrel' });
      },
    };
  },
};
