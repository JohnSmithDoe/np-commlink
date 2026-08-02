export type TrackplayId = string;
type EpochMillis = number; // epoch ms (Date.now())

interface TrackplayEntity {
  id: TrackplayId;
  name: string;
  created: EpochMillis;
}

export interface Round extends TrackplayEntity {
  idx: number;
  values: Record<TrackplayId, number>;
}

export interface Player extends TrackplayEntity {
  lastPlayed?: EpochMillis;
}

export interface GameType {
  id: TrackplayId;
  name: string;
  winHigh: boolean;
}

export interface Game extends TrackplayEntity {
  type: TrackplayId; // -> GameType.id
  players: TrackplayId[]; // -> Player.id[]
  rounds: TrackplayId[]; // -> Round.id[] (ordered)
  ended: boolean;
  updated: EpochMillis;
}

export interface GameConfig {
  sort: 'name' | 'date' | 'updated';
  direction: 'asc' | 'desc';
  filter: string;
  typeId: TrackplayId; // '' = no type filter
  showEndedGames: boolean;
}

export interface PlayersConfig {
  sort: 'name' | 'date' | 'last';
  direction: 'asc' | 'desc';
  filter: string;
}

export interface TrackplayConfig {
  games: GameConfig;
  gamesForPlayer: GameConfig;
  players: PlayersConfig;
}

export interface PlayerStats {
  play: number;
  win: number;
  loss: number;
  open: number;
}

interface TrackplaySnapshot {
  players: Record<TrackplayId, Player>;
  games: Record<TrackplayId, Game>;
  gameTypes: Record<TrackplayId, GameType>;
  rounds: Record<TrackplayId, Round>;
}

export interface TrackplayDeleted {
  name: string;
  snapshot: TrackplaySnapshot;
}

export interface TrackplayState {
  players: Record<TrackplayId, Player>;
  games: Record<TrackplayId, Game>;
  gameTypes: Record<TrackplayId, GameType>;
  rounds: Record<TrackplayId, Round>;
  config: TrackplayConfig;
  lastDeleted: TrackplayDeleted | null;
}
