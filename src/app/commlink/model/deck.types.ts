import { TMarker } from '../../@shared/model/app.types';

/** online = jacked in · standby = wired, app not merged yet · offline = dark. */
export type TProgramStatus = 'online' | 'standby' | 'offline';

/**
 * The coarse grouping a deck entry belongs to — one per domain, so toggling
 * `groceries` reaches its four entries at once.
 *
 * Deliberately NOT the telemetry `source` vocabulary, which is per *aggregate*
 * (`shopping`, `storage`, `products` are three sources inside this one module).
 * Two granularities of the same idea; there must never be a second spelling of
 * either.
 */
export type TAppModule =
  | 'commlink'
  | 'tracking'
  | 'office-time'
  | 'notifications'
  | 'barcode'
  | 'groceries'
  | 'tasks'
  | 'cash'
  | 'trackplay'
  | 'geist'
  | 'settings';

/** Stable across releases — the persisted config references entries by it. */
export type TDeckEntryId = string;

/**
 * One navigable destination, as the deck and the side menu both see it.
 *
 * It carries no label: codenames change with the theme, so the name and
 * description are looked up as `deck.<theme>.<id>.name`/`.desc` instead. The
 * menu row keeps `titleKey` — a menu row and its page's title are the same
 * string, and only what varies by theme belongs under `deck.*`.
 */
export type IDeckEntry = {
  id: TDeckEntryId;
  module: TAppModule;
  icon: string;
  route: string;
  titleKey: TMarker;
  /** Menu-only entries (the deck's own home link, the grocery flags page). */
  onDeck: boolean;
  /**
   * `source` + `metric` overlay a live count from the dashboard read-model onto
   * the tile (via `selectTelemetry(source).metrics[metric]`) — commlink stays
   * domain-blind, reading only the CQRS read-model. Tiles with no data domain
   * (SIGIL, SYSOP, GEIST) leave them unset and render no badge.
   */
  source?: string;
  metric?: string;
  /**
   * Declared status, for the tiles with no telemetry source. A `source`-backed
   * tile reports what the read-model holds for it instead.
   */
  status?: TProgramStatus;
  /**
   * Set where the program needs Chrome's on-device model, which exists only in
   * desktop Chrome — the deck must not advertise a program that cannot run on
   * this platform.
   */
  needsLanguageModel?: boolean;
  /**
   * Set where the badge's live metric is a money amount rather than a count —
   * it renders through the themed currency label instead of a bare number.
   */
  currency?: true;
};

/** A catalog entry resolved against the active theme, ready to render. */
export type IDeckProgram = IDeckEntry & {
  nameKey: TMarker;
  descKey: TMarker;
};

/**
 * A program as the config page sees it. `moduleHidden` is reported beside the
 * entry's own flag rather than folded into it, so a row switched off by its
 * module still shows the state the user chose for it.
 */
export type IDeckProgramConfig = IDeckProgram & {
  hidden: boolean;
  moduleHidden: boolean;
};

export type IDeckModuleConfig = {
  module: TAppModule;
  labelKey: TMarker;
  hidden: boolean;
};

/**
 * The user's deck configuration (persisted as `npc-deck`).
 *
 * Three id lists where **absence means default**: an entry missing from `order`
 * sorts to the end in catalog order, one missing from `hiddenEntries` is
 * visible, and an id no longer in the catalog is ignored on read. That is what
 * lets the catalog grow and shrink without a migration hop — only *renaming* an
 * id would need one, which is why ids are never renamed.
 *
 * `order` is a list rather than an `order: number` per entry because a list IS
 * the order: no renumbering on every drop, no gaps, no two entries claiming 3.
 */
export type IDeckState = {
  order: TDeckEntryId[];
  hiddenEntries: TDeckEntryId[];
  hiddenModules: TAppModule[];
};
