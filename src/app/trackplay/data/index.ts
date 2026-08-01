/**
 * Public API of the `trackplay` data module (Sheriff barrel).
 *
 * Facade-only surface — consumers get the action contract (kept for specs,
 * the app-wide convention every domain's barrel follows), the facade, and the
 * lazy context bundle, and nothing else. The reducer, initial state, effects,
 * and every selector are module internals and stay hidden: importing them
 * from outside `trackplay/data` is a Sheriff encapsulation violation.
 *
 * Named re-exports only (never `export *`) so the public surface is explicit
 * and a type-only consumer can't drag runtime providers into its chunk.
 */
export { TrackplayActions } from './trackplay.actions';
export { TrackplayFacade } from './trackplay.facade';
export { trackplayContext } from './trackplay.providers';
