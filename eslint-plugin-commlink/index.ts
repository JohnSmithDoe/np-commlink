/* ─── why ─────────────────────────────────────────────────────────
 * This project's own gates, not published.
 *
 * Rules rather than `no-restricted-syntax` / `no-restricted-imports`
 * options, because flat config REPLACES a rule's option bag instead of
 * merging it: a selector added in one block is silently dropped wherever
 * a later block sets the same rule. A rule id cannot be shadowed that
 * way, it can say *why*, and it can read more than the shape of one node.
 *
 * Loaded straight from TypeScript source — Node >= 22.18 strips types on
 * `require()` of a `.ts` file, with no flags and no build, which is what
 * lets eslint.config.js stay `.js` (the @angular-eslint builder resolves
 * only eslint.config.{js,mjs,cjs}). Two constraints follow: stripping
 * does not type-check, so `pnpm run lint` runs `tsc -p` first (see that
 * tsconfig's header), and every relative import must carry an explicit
 * `.ts` — an extensionless one fails at config load with
 * MODULE_NOT_FOUND.
 * ───────────────────────────────────────────────────────────────── */

export { rules } from './rules.ts';
export * as configs from './configs.ts';

export const meta = {
  name: 'eslint-plugin-commlink',
  version: '1.0.0',
};
