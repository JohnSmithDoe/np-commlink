/**
 * Public model of the `tracking` bounded context (type:model).
 *
 * The tracking-owned types, split out of the `@shared/types` god-file
 * (DDD review #1). Shared-kernel types they build on (IBaseItem, TTimestamp,
 * IListState, TEditItemMode) are imported from `@shared/types`; everything
 * tracking-specific lives here and is imported by the tracking domain via
 * `../model` / `../../model`.
 */
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { TMarker, TTimestamp } from '../../@shared/model/app.types';
import { IBaseItem } from '../../@shared/model/base-item.types';
import { IListState } from '../../@shared/model/item-list.types';

// Purely an ItemDialogService handshake token — the tracking list state carries
// no `id`, and its `/data` route carries no list param at all
// ('today'/'daily').
export const TRACKING_LIST_ID = '_tracking';

// The deep-link commands tracking publishes on a notification's `action.type`.
// Tracking is the only reader: the shared port carries the string opaquely and
// the CTA's label rides along on the same action, so adding a command is a change
// in this domain alone.
export type TTrackingCommand = 'tracking.start' | 'tracking.pause';

export type ITrackingItem = IBaseItem & {
  startTime?: TTimestamp;
  breakTime?: TTimestamp;
  trackedTimeInSeconds?: number;
  breakInSeconds?: number;
  state: TTrackingItemState;
};

/**
 * One row of the stats page: several sessions of the same activity, merged into
 * the bucket the selected view groups by (a day, a month, all time).
 *
 * `id` is the bucket's own key, not a session's — a row deletes the sessions it
 * lists in `sessionIds`, so merging can never make "delete this row" mean
 * "delete one of the sessions behind it".
 */
export type IDataItem = Pick<
  ITrackingItem,
  'trackedTimeInSeconds' | 'name' | 'id' | 'startTime'
> & {
  sessionIds: string[];
};

/** The stacked-bar chart's source: one hours-per-day row per charted activity. */
export type DailySeries = {
  days: string[];
  /**
   * One entry per charted activity, plus at most one remainder bucket for
   * everything past the top N.
   *
   * The remainder carries **no name**, and its absence is what identifies it. It
   * used to be labelled `'Other'` where it was built — a word, in English, in an
   * app whose default language is German. Naming it is the render site's job; a
   * sentinel string would also have been indistinguishable from an activity a
   * user happened to call the same thing.
   */
  series: { name?: string; hours: number[] }[];
};

type TTrackingItemState = 'running' | 'stopped' | 'paused';

// Keyed by the union so a new state cannot ship without a label, and spelled out
// because the row reads them through a lookup — the composed
// `'tracking.item.state.' + state` this replaces was invisible to the extractor.
export const TRACKING_STATE_LABEL_KEYS: Record<TTrackingItemState, TMarker> = {
  running: marker('tracking.item.state.running'),
  stopped: marker('tracking.item.state.stopped'),
  paused: marker('tracking.item.state.paused'),
};

/**
 * How the sessions archive is bucketed on the data page. It was a bare `string`,
 * so the five options lived only as `value=` literals in one template while three
 * separate switches each fell through a `default:` that silently meant `'raw'` —
 * a sixth view would have compiled and quietly grouped per minute.
 */
export type TTrackingViewId = 'raw' | 'today' | 'daily' | 'monthly' | 'all';

// The union as a value, so the picker renders every member instead of listing
// them again in a template (the `THEMES` arrangement).
export const TRACKING_VIEW_IDS = [
  'raw',
  'today',
  'daily',
  'monthly',
  'all',
] as const satisfies readonly TTrackingViewId[];

type TTrackingList = IListState<ITrackingItem> & {
  sessions: ITrackingItem[];
  sessionsViewId: TTrackingViewId;
};
export type ITrackingState = TTrackingList;
