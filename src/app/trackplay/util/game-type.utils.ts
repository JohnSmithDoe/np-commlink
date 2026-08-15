/* ─── why ─────────────────────────────────────────────────────────
 * A game's type is stored in the inherited `categoryIds`, so the shared
 * chip bar and `matcherForFilter` work on it untouched. The array is the
 * price: trackplay's rule is exactly one type, always, and "no type" is not
 * a state a game can be in — `winHigh` decides who won. Every read goes
 * through here so that rule has one home, and `deleteGameTypeCascade` is
 * what keeps it true on the write side.
 * ───────────────────────────────────────────────────────────────── */

import { Game, TrackplayId } from '../model/trackplay.types';
import { DEFAULT_GAME_TYPE_ID } from './trackplay.factory';

export const gameTypeIdOf = (game: Game): TrackplayId =>
  game.categoryIds?.[0] ?? DEFAULT_GAME_TYPE_ID;

export const withGameTypeId = (game: Game, typeId: TrackplayId): Game => ({
  ...game,
  categoryIds: [typeId],
});
