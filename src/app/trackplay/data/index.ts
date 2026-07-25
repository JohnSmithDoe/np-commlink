/**
 * Public API of the `trackplay` data module (Sheriff barrel).
 *
 * Facade-only surface — consumers get the action contract, the read
 * selectors they actually query, and the lazy providers, and nothing else.
 * The reducer, initial state, load/save/telemetry effects, the raw feature
 * selector, and internal-only selectors (`selectTrackplayState`,
 * `selectRounds`, `selectLastDeleted`, `selectGameCount`) are module
 * internals and stay hidden: importing them from outside `trackplay/data` is
 * a Sheriff encapsulation violation.
 *
 * Named re-exports only (never `export *`) so the public surface is explicit
 * and a type-only consumer can't drag runtime providers into its chunk.
 */
export { TrackplayActions } from './trackplay.actions';
export { TrackplayFacade } from './trackplay.facade';
export {
  selectPlayers,
  selectGames,
  selectGameTypes,
  selectTrackplayConfig,
  selectGameList,
  selectPlayerList,
  selectGameTypeList,
  selectGameById,
  selectPlayerById,
  selectRoundsByGame,
  selectScoresByGame,
  selectResultByGame,
  selectWinnerByGame,
  selectGamesForPlayer,
  selectPlayerStats,
  selectStatsForPlayer,
} from './trackplay.selector';
export {
  trackplayLazyProviders,
  trackplayHydrationResolver,
} from './provide-trackplay-lazy';
