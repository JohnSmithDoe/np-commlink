import { createFeatureSelector, createSelector } from '@ngrx/store';
import { IDashboardState } from '../../model/dashboard.types';

export const selectDashboardState =
  createFeatureSelector<IDashboardState>('dashboard');

// What the shell's always-on notification badge binds to: the `unread` metric the
// notifications context reports, narrowed to a number. Why it reads the
// read-model instead of the inbox slice is on `DashboardFacade`.
export const selectNotificationsUnread = createSelector(
  selectDashboardState,
  (s): number => {
    const v = s.bySource['notifications']?.metrics?.['unread'];
    return typeof v === 'number' ? v : 0;
  }
);
