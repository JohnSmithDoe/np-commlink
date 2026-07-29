/**
 * Public API of the `office-time` data module (Sheriff barrel).
 *
 * Facade-only surface — consumers (the office-time feature pages, the dash
 * smart-ui components, and the domain's route manifest) get the action contract,
 * the facade and the lazy context bundle, and nothing else. Reducer, effects,
 * initial state and every selector are module internals: reading state anywhere
 * but through `OfficeTimeFacade` is a Sheriff encapsulation violation, and the
 * domain's pure date helpers are `util`, imported from there directly.
 *
 * Named re-exports only (never `export *`) so the public surface is explicit
 * and a type-only consumer can't drag runtime providers into its chunk.
 */

export { OfficeTimeActions } from './actions/office-time.actions';
export { OfficeTimeFacade } from './office-time.facade';
export { officeTimeContext } from './office-time.providers';
