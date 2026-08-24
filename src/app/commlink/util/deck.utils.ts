import { LanguageModelAvailability, Skin } from '../../@shared/model/app.types';
import { DashboardState } from '../model/dashboard.types';
import { DeckChrome, DeckChromeField } from '../model/deck.catalog';
import { DECK_MODULE_LABELS } from '../model/deck.labels';
import {
  AppModule,
  DeckEntry,
  DeckModuleConfig,
  DeckProgram,
  DeckProgramConfig,
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
  skin: Skin,
  locale: string
): string =>
  entry.currency ? currencyLabel(skin, value, locale) : String(value);

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

export function moveOnDeck(
  order: readonly DeckEntryId[],
  visible: readonly DeckEntryId[],
  id: DeckEntryId,
  delta: -1 | 1
): DeckEntryId[] {
  const onDeck = order.filter((entry) => visible.includes(entry));
  const neighbour = onDeck[onDeck.indexOf(id) + delta];
  if (!onDeck.includes(id) || neighbour === undefined) return [...order];

  return order.map((entry) =>
    entry === id ? neighbour : entry === neighbour ? id : entry
  );
}

export const badgeValue = (
  telemetry: DashboardState,
  entry: DeckEntry
): number | null => {
  if (!entry.source || !entry.metric) return null;
  const value = telemetry.bySource[entry.source]?.metrics[entry.metric];
  return value == undefined ? null : Number(value);
};

export const groupingModules = (
  catalog: readonly DeckEntry[]
): Set<AppModule> => {
  const seen = new Set<AppModule>();
  const grouping = new Set<AppModule>();
  for (const entry of catalog) {
    if (seen.has(entry.module)) grouping.add(entry.module);
    seen.add(entry.module);
  }
  return grouping;
};

export const isEntryVisible = (state: DeckState, entry: DeckEntry): boolean =>
  state.visibleEntries.includes(entry.id);

export const entriesOnDeck = (
  catalog: readonly DeckEntry[],
  state: DeckState
): DeckEntry[] =>
  orderEntries(catalog, state.order).filter((entry) =>
    isEntryVisible(state, entry)
  );

export const resolveLabels =
  (skin: Skin) =>
  (entry: DeckEntry): DeckProgram => ({ ...entry, ...entry.labels[skin] });

const sameOrder = <T>(a: readonly T[], b: readonly T[]): boolean =>
  a.length === b.length && a.every((value, index) => value === b[index]);

const sameSet = <T>(a: readonly T[], b: readonly T[]): boolean =>
  a.length === b.length && a.every((value) => b.includes(value));

export const isFactoryDeck = (state: DeckState, factory: DeckState): boolean =>
  sameOrder(state.order, factory.order) &&
  sameSet(state.visibleEntries, factory.visibleEntries);

export const toggleIn = <T>(list: readonly T[], value: T): T[] =>
  list.includes(value)
    ? list.filter((entry) => entry !== value)
    : [...list, value];

export const reorderVisible = (
  order: readonly DeckEntryId[],
  visibleOrder: readonly DeckEntryId[]
): DeckEntryId[] => [
  ...visibleOrder,
  ...order.filter((id) => !visibleOrder.includes(id)),
];

export const setIn = <T>(
  list: readonly T[],
  values: readonly T[],
  present: boolean
): T[] =>
  present
    ? [...list, ...values.filter((value) => !list.includes(value))]
    : list.filter((entry) => !values.includes(entry));

export const groupByModule = (
  programs: readonly DeckProgramConfig[]
): DeckModuleConfig[] => {
  const order: AppModule[] = [];
  const byModule = new Map<AppModule, DeckProgramConfig[]>();
  for (const program of programs) {
    const group = byModule.get(program.module);
    if (group) group.push(program);
    else {
      order.push(program.module);
      byModule.set(program.module, [program]);
    }
  }

  return order.map((module) => {
    const group = byModule.get(module) ?? [];
    const visibleCount = group.filter((program) => !program.hidden).length;
    return {
      module,
      labelKey: DECK_MODULE_LABELS[module],
      programs: group,
      visibleCount,
      allVisible: visibleCount === group.length,
      grouped: group.length > 1,
    };
  });
};
