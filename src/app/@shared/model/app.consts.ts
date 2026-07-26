/**
 * App-wide persisted-schema version.
 *
 * Versioning is app-level; migration is domain-level. Every persisted doc is
 * stamped with this single version (a `{v,data}` envelope) and migrated up to it
 * on read. When any persisted shape changes, bump APP_VERSION once and add the
 * transforming step to the affected domain's ladder
 * (`<domain>/data/<domain>.migrations.ts`) — domains that didn't change at that
 * version simply have no step for the hop.
 */
export const APP_VERSION = 1;
