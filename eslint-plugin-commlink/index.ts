// eslint-plugin-commlink — this project's own gates, not published.
//
// Three families that eslint.config.js used to hand-roll: the Ionic a11y set (the
// mechanical half of docs/ionic-a11y-practices.md), the i18n vocabulary gate, and
// the NgRx import ban. They are rules rather than `no-restricted-syntax` /
// `no-restricted-imports` options because flat config *replaces* a rule's options
// instead of merging them — a selector added to one block was silently dropped
// wherever a later block set the same rule. A rule id cannot be shadowed that
// way, and a rule can say *why*, and can read more than the shape of one node.
//
// Loaded straight from TypeScript source: Node >= 22.18 strips types on
// `require()` of a `.ts` file with no flags and no build, which is why
// eslint.config.js can stay `.js` (the @angular-eslint builder resolves only
// eslint.config.{js,mjs,cjs}). Stripping does not type-check, so `pnpm run lint`
// runs `tsc -p eslint-plugin-commlink` first — see that tsconfig's header.
//
// Relative imports must carry an explicit `.ts`: Node resolves no extension for
// us, and an extensionless one fails at config load with MODULE_NOT_FOUND.

export { rules } from './rules.ts';
export * as configs from './configs.ts';

export const meta = {
  name: 'eslint-plugin-commlink',
  version: '1.0.0',
};
