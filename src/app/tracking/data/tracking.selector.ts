import {
  createFeatureSelector,
  createSelector,
  createSelectorFactory,
  resultMemoize,
} from '@ngrx/store';
import {
  TrackingItem,
  TrackingState,
  TrackingViewId,
} from '../model/tracking.types';
import { formatSecondsAsClock } from '../util/tracking.utils';
import {
  filterAndSortItemList,
  filterListBySearchQuery,
} from '../../@shared/util/item-lists/list.selector';
import { SearchResult } from '../../@shared/model/item-list.types';

export const TRACKING_STATE_KEY = 'tracking';

export const selectTrackingState =
  createFeatureSelector<TrackingState>(TRACKING_STATE_KEY);

const liveSessions = (state: TrackingState): TrackingItem[] =>
  (state?.items ?? []).filter((item) => !!item.startTime);

export const selectArchivedSessions = createSelector(
  selectTrackingState,
  (state: TrackingState): TrackingItem[] => state?.sessions ?? []
);

export const selectTrackingDataViewId = createSelector(
  selectTrackingState,
  (state: TrackingState): TrackingViewId => state?.sessionsViewId ?? 'today'
);

export const selectTrackingItems = createSelector(
  selectTrackingState,
  (state: TrackingState): TrackingItem[] => state?.items ?? []
);

export const selectTrackingListSearchResult = createSelector(
  selectTrackingState,
  (listState: TrackingState): SearchResult<TrackingItem> | undefined =>
    filterListBySearchQuery(listState)
);

export const selectTrackingListItems = createSelector(
  selectTrackingState,
  selectTrackingListSearchResult,
  (state: TrackingState, result): TrackingItem[] =>
    filterAndSortItemList(state, result)
);
export const selectRunningTrackingItem = createSelector(
  selectTrackingState,
  (state: TrackingState): TrackingItem | undefined =>
    state.items.find((item) => item.state === 'running')
);

export const selectAllTrackingSessions = createSelector(
  selectTrackingState,
  (state: TrackingState): TrackingItem[] => [
    ...liveSessions(state),
    ...(state?.sessions ?? []),
  ]
);

const toMinuteResolution = (session: TrackingItem): TrackingItem => ({
  ...session,
  trackedTimeInSeconds:
    Math.floor((session.trackedTimeInSeconds ?? 0) / 60) * 60,
});

const sameChartSessions = (a: TrackingItem[], b: TrackingItem[]): boolean =>
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

export const selectLiveChartSessions = createSelectorFactory<
  object,
  TrackingItem[]
>((projector) => resultMemoize(projector, sameChartSessions))(
  selectTrackingState,
  (state: TrackingState): TrackingItem[] =>
    liveSessions(state).map((session) => toMinuteResolution(session))
);

export const selectTrackingTime = createSelector(
  selectTrackingState,
  (state: TrackingState) => {
    const timeInSeconds = state.items.reduce(
      (current, previous) => current + (previous.trackedTimeInSeconds ?? 0),
      0
    );
    return formatSecondsAsClock(timeInSeconds);
  }
);

export const selectTrackingItemCount = createSelector(
  selectTrackingState,
  (state) => state?.items.length ?? 0
);
