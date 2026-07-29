/**
 * App-wide persisted-schema version.
 *
 * Versioning is app-level; migration is domain-level. Every persisted doc is
 * stamped with this single version (a `{v,data}` envelope) and migrated up to it
 * on read. When any persisted shape changes, bump APP_VERSION once and add the
 * transforming step to the affected context's `ladder`, declared on its
 * `providePersistedContext({ ladder })` — contexts that didn't change at that
 * version declare no step for the hop, which is why most declare none at all.
 */
export const APP_VERSION = 1;

/**
 * The release identity — the version a *user* is looking at, and deliberately
 * not `APP_VERSION` above: that one is the persisted-schema number driving
 * `runMigrations`, and the two move on unrelated cadences (a release that
 * changes no persisted shape bumps only this; a migration hop bumps only that).
 *
 * `package.json` owns the value and the build injects it as `NPC_RELEASE`
 * (declared in `src/app-release.d.ts`), so nothing here restates it. `ng serve`
 * and Vitest apply no define, which is why the read is `typeof`-guarded and dev
 * honestly reads `dev` instead of a literal that would go stale.
 */
export const APP_RELEASE =
  typeof NPC_RELEASE === 'string' && NPC_RELEASE.length > 0
    ? NPC_RELEASE
    : 'dev';

/**
 * AGPL §13: a copy reached over a network owes its users the corresponding
 * source, and Codeberg Pages serves exactly such a copy — so the settings page
 * links here rather than leaving the offer to the README nobody opens.
 */
export const SOURCE_URL = 'https://codeberg.org/Letothec0dem0nkey/np-commlink';
