import {
  createFeatureSelector,
  createSelector,
  createSelectorFactory,
  resultMemoize,
} from '@ngrx/store';
import {
  ITrackingItem,
  ITrackingState,
  TTrackingViewId,
} from '../model/tracking.types';
import { formatSecondsAsClock } from '../util/tracking.utils';
import {
  filterAndSortItemList,
  filterListBySearchQuery,
} from '../../@shared/util/item-lists/list.selector';
import { ISearchResult } from '../../@shared/model/item-list.types';

export const TRACKING_STATE_KEY = 'tracking';

export const selectTrackingState =
  createFeatureSelector<ITrackingState>(TRACKING_STATE_KEY);

// A started item is already a session — it is just not archived yet.
const liveSessions = (state: ITrackingState): ITrackingItem[] =>
  (state?.items ?? []).filter((item) => !!item.startTime);

// The archive is what every session-derived view is really keyed on, and it is
// untouched by the 1 Hz `updateTracking` tick — so reading it (instead of the
// whole slice) is what keeps those views off the tick.
export const selectArchivedSessions = createSelector(
  selectTrackingState,
  (state: ITrackingState): ITrackingItem[] => state?.sessions ?? []
);

export const selectTrackingDataViewId = createSelector(
  selectTrackingState,
  (state: ITrackingState): TTrackingViewId => state?.sessionsViewId ?? 'today'
);

/**
 * Every tracked item, unfiltered — as opposed to {@link selectTrackingListItems},
 * which is the PAGE's view (its search query and category filter applied). The
 * edit dialog's duplicate-name rule needs the aggregate: a search term left in
 * the box would otherwise shrink the sibling set and let a duplicate save.
 */
export const selectTrackingItems = createSelector(
  selectTrackingState,
  (state: ITrackingState): ITrackingItem[] => state?.items ?? []
);

export const selectTrackingListSearchResult = createSelector(
  selectTrackingState,
  (listState: ITrackingState): ISearchResult<ITrackingItem> | undefined =>
    filterListBySearchQuery(listState)
);

export const selectTrackingListItems = createSelector(
  selectTrackingState,
  selectTrackingListSearchResult,
  (state: ITrackingState, result): ITrackingItem[] =>
    filterAndSortItemList(state, result)
);
export const selectRunningTrackingItem = createSelector(
  selectTrackingState,
  (state: ITrackingState): ITrackingItem | undefined =>
    state.items.find((item) => item.state === 'running')
);

export const selectAllTrackingSessions = createSelector(
  selectTrackingState,
  (state: ITrackingState): ITrackingItem[] => [
    ...liveSessions(state),
    ...(state?.sessions ?? []),
  ]
);

// The chart renders whole days in hours, so a live row only needs minute
// resolution — and that is what keeps the 1 Hz `updateTracking` tick out of the
// 21-day aggregation below: the result keeps its identity until a live minute
// genuinely rolls over, so the series is rebuilt once a minute, not once a
// second (`selectAllTrackingSessions` stays at second resolution for the
// daily-sessions panel, which shows a running clock).
const toMinuteResolution = (session: ITrackingItem): ITrackingItem => ({
  ...session,
  trackedTimeInSeconds:
    Math.floor((session.trackedTimeInSeconds ?? 0) / 60) * 60,
});

const sameChartSessions = (a: ITrackingItem[], b: ITrackingItem[]): boolean =>
  a.length === b.length &&
  a.every((session, index) => {
    const other = b[index];
    return (
      other !== undefined &&
      session.id === other.id &&
      session.name === other.name &&
      session.startTime === other.startTime &&
      session.trackedTimeInSeconds === other.trackedTimeInSeconds
    );
  });

/**
 * The live rows the chart adds to the archive, at minute resolution.
 *
 * `resultMemoize` is what keeps the whole chart off the 1 Hz `updateTracking`
 * tick: the projector re-runs every second, but it returns the previous array
 * REFERENCE unless a whole minute rolled over, so nothing downstream recomputes.
 * That guarantee is why this stays a selector while the day-dependent assembly
 * moved out to `util/sessions.utils` — a signal reading it re-notifies exactly as
 * rarely.
 */
export const selectLiveChartSessions = createSelectorFactory<
  object,
  ITrackingItem[]
>((projector) => resultMemoize(projector, sameChartSessions))(
  selectTrackingState,
  (state: ITrackingState): ITrackingItem[] =>
    liveSessions(state).map((session) => toMinuteResolution(session))
);

export const selectTrackingTime = createSelector(
  selectTrackingState,
  (state: ITrackingState) => {
    const timeInSeconds = state.items.reduce(
      (current, previous) => current + (previous.trackedTimeInSeconds ?? 0),
      0
    );
    return formatSecondsAsClock(timeInSeconds);
  }
);

// Number of tracked activities on the deck's CHRONO tile.
export const selectTrackingItemCount = createSelector(
  selectTrackingState,
  (state) => state?.items.length ?? 0
);
