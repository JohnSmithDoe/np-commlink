import { Game, GameType, TrackplayId } from '../model/trackplay.types';

export const gameTypeName = (
  game: Game,
  gameTypes: Record<TrackplayId, GameType>,
  fallback: string
): string => gameTypes[game.type]?.name ?? fallback;
