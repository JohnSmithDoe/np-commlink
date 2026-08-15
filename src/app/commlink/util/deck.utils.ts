import {
  LanguageModelAvailability,
  Theme,
} from '../../@shared/model/app.types';
import { DashboardState } from '../model/dashboard.types';
import { DeckChrome, DeckChromeField } from '../model/deck.catalog';
import {
  DeckEntry,
  DeckProgram,
  DeckState,
  DeckEntryId,
  ProgramStatus,
} from '../model/deck.types';
import { currencyLabel } from './currency-label.utils';

const LANGUAGE_MODEL_STATUS: Record<LanguageModelAvailability, ProgramStatus> =
  {
    available: 'online',
    downloadable: 'standby',
    downloading: 'standby',
    probing: 'standby',
    unavailable: 'offline',
  };

const NODE_STATUS_FIELD: Record<ProgramStatus, DeckChromeField> = {
  online: 'node-online',
  standby: 'node-standby',
  offline: 'node-offline',
};

export const programStatus = (
  entry: DeckEntry,
  telemetry: DashboardState,
  availability: LanguageModelAvailability
): ProgramStatus => {
  if (entry.needsLanguageModel) return LANGUAGE_MODEL_STATUS[availability];
  if (entry.source)
    return telemetry.bySource[entry.source]?.status ?? 'standby';
  return entry.status ?? 'online';
};

export const badgeLabel = (
  entry: DeckEntry,
  value: number,
  theme: Theme,
  locale: string
): string =>
  entry.currency ? currencyLabel(theme, value, locale) : String(value);

export const nodeStatusKey = (
  chrome: DeckChrome,
  status: ProgramStatus
): string => chrome[NODE_STATUS_FIELD[status]];

export const reportedMetric = (
  telemetry: DashboardState,
  source: string,
  metric: string
): number | null => {
  const value = telemetry.bySource[source]?.metrics[metric];
  return value == undefined ? null : Number(value);
};

export const resonanceRatingOf = (percentage: number): string =>
  ((percentage / 100) * 6).toFixed(1);

export function orderEntries(
  catalog: readonly DeckEntry[],
  order: readonly DeckEntryId[]
): DeckEntry[] {
  const byId = new Map(catalog.map((entry) => [entry.id, entry]));
  const configured = order
    .map((id) => byId.get(id))
    .filter((entry): entry is DeckEntry => entry !== undefined);

  const configuredIds = new Set(order);
  const added = catalog.filter((entry) => !configuredIds.has(entry.id));

  return [...configured, ...added];
}

export const badgeValue = (
  telemetry: DashboardState,
  entry: DeckEntry
): number | null => {
  if (!entry.source || !entry.metric) return null;
  const value = telemetry.bySource[entry.source]?.metrics[entry.metric];
  return value == undefined ? null : Number(value);
};

export const isEntryVisible = (state: DeckState, entry: DeckEntry): boolean =>
  !state.hiddenModules.includes(entry.module) &&
  !state.hiddenEntries.includes(entry.id);

export const visibleEntries = (
  catalog: readonly DeckEntry[],
  state: DeckState
): DeckEntry[] =>
  orderEntries(catalog, state.order).filter((entry) =>
    isEntryVisible(state, entry)
  );

export const resolveLabels =
  (theme: Theme) =>
  (entry: DeckEntry): DeckProgram => ({ ...entry, ...entry.labels[theme] });

const sameOrder = <T>(a: readonly T[], b: readonly T[]): boolean =>
  a.length === b.length && a.every((value, index) => value === b[index]);

const sameSet = <T>(a: readonly T[], b: readonly T[]): boolean =>
  a.length === b.length && a.every((value) => b.includes(value));

export const isFactoryDeck = (state: DeckState, factory: DeckState): boolean =>
  sameOrder(state.order, factory.order) &&
  sameSet(state.hiddenEntries, factory.hiddenEntries) &&
  sameSet(state.hiddenModules, factory.hiddenModules);

export const toggleIn = <T>(list: readonly T[], value: T): T[] =>
  list.includes(value)
    ? list.filter((entry) => entry !== value)
    : [...list, value];
