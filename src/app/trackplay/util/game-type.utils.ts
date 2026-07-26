import { IGame, IGameType, TID } from '../model/trackplay.types';

export const gameTypeName = (
  game: IGame,
  gameTypes: Record<TID, IGameType>,
  fallback: string
): string => gameTypes[game.type]?.name ?? fallback;
