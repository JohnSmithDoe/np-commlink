export const BOARD_PLAYER_COUNTS = [
  2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
] as const;

export type BoardPlayerCount = (typeof BOARD_PLAYER_COUNTS)[number];

export type BoardFieldId = string;

export type BoardFieldKind = 'track' | 'start' | 'goal' | 'nest';

export interface BoardField {
  id: BoardFieldId;
  kind: BoardFieldKind;
  player: number | null;
  index: number;
  x: number;
  y: number;
}

export interface BoardLayout {
  players: BoardPlayerCount;
  pieces: number;
  fieldsPerPlayer: number;
  trackLength: number;
  radius: number;
  viewBox: string;
  fields: readonly BoardField[];
}

export interface BoardFigure {
  player: number;
  piece: number;
  fieldId: BoardFieldId;
}

export interface BoardRules {
  entryRoll: number;
  exactHome: boolean;
  jumpOwnInHome: boolean;
  throwOnLanding: boolean;
  blockOwn: boolean;
}

export interface BoardState {
  players: BoardPlayerCount;
  figures: readonly BoardFigure[];
  rules: BoardRules;
}
