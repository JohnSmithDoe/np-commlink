import { createFeatureSelector, createSelector } from '@ngrx/store';
import { IDashboardState } from '../../model/dashboard.types';

export const selectDashboardState =
  createFeatureSelector<IDashboardState>('dashboard');

export const selectTelemetry = (source: string) =>
  createSelector(selectDashboardState, (s) => s.bySource[source]);

// The always-on notification badge (app shell) reads its unread count from the
// EAGER dashboard read-model rather than the notifications slice, so the shell
// never depends on that (soon-to-be lazy) slice. Notifications reports `unread`
// into the read-model (NotificationsTelemetryEffects); this just surfaces it as
// a number for the badge. Cold launch → the persisted `npc-summary-notifications`
// carries the last-known count until notifications is next visited.
export const selectNotificationsUnread = createSelector(
  selectDashboardState,
  (s): number => {
    const v = s.bySource['notifications']?.metrics?.['unread'];
    return typeof v === 'number' ? v : 0;
  }
);
