// The `trackplay` bounded context owns its model (DDD review #1 — the god
// `@shared/types` file is being split so each context holds its own types).
// One sealed slice of NORMALIZED maps (players / games / gameTypes / rounds)
// keyed by TID. Player counters and per-game scores/winners are DERIVED in
// selectors — never stored. Timestamps are epoch-ms numbers (TDateTime),
// distinct from the ISO-string TTimestamp used by the timetracker/grocery items.

export type TID = string;
export type TDateTime = number; // epoch ms (Date.now())

export interface IBase {
  id: TID;
  name: string;
  created: TDateTime;
}

// One scoring round: playerId -> points scored that round.
export interface IRound extends IBase {
  idx: number;
  values: Record<TID, number>;
}

// A player. NOTE: play/win/loss/open counters are DERIVED (see playerStats
// selector), not stored — only `lastPlayed` is persisted.
export interface IPlayer extends IBase {
  lastPlayed?: TDateTime;
}

// A game variant. Does NOT extend IBase (no `created`). winHigh=true means the
// highest total wins; false means the lowest total wins.
export interface IGameType {
  id: TID;
  name: string;
  winHigh: boolean;
}

export interface IGame extends IBase {
  type: TID; // -> IGameType.id
  players: TID[]; // -> IPlayer.id[]
  rounds: TID[]; // -> IRound.id[] (ordered)
  ended: boolean;
  updated: TDateTime;
}

// Per-list sort/filter config (games list, games-for-player list).
export interface IGameConfig {
  sort: 'name' | 'date' | 'updated';
  dir: 'asc' | 'desc';
  filter: string;
  typeId: TID; // '' = no type filter
  showEndedGames: boolean;
}

export interface ITrackplayConfig {
  games: IGameConfig;
  gamesForPlayer: IGameConfig;
  players: {
    sort: 'name' | 'date' | 'last';
    dir: 'asc' | 'desc';
    filter: string;
  };
}

// Derived per-player counters (from games + rounds). `loss` replaces the
// legacy "loose" misspelling.
export interface IPlayerStats {
  play: number;
  win: number;
  loss: number;
  open: number;
}

// Full snapshot of the mutable trackplay maps + config, captured before a
// destructive action so a single-level undo can re-insert it verbatim.
export interface ITrackplaySnapshot {
  players: Record<TID, IPlayer>;
  games: Record<TID, IGame>;
  gameTypes: Record<TID, IGameType>;
  rounds: Record<TID, IRound>;
  config: ITrackplayConfig;
}

// Single-slot undo payload: the snapshot + a human name for the toast.
export interface ITrackplayDeleted {
  name: string;
  snapshot: ITrackplaySnapshot;
}

export interface ITrackplayState {
  players: Record<TID, IPlayer>;
  games: Record<TID, IGame>;
  gameTypes: Record<TID, IGameType>;
  rounds: Record<TID, IRound>;
  config: ITrackplayConfig;
  lastDeleted: ITrackplayDeleted | null;
}
