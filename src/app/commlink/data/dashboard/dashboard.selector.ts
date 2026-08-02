import { createFeatureSelector, createSelector } from '@ngrx/store';
import { DashboardState } from '../../model/dashboard.types';

export const DASHBOARD_STATE_KEY = 'dashboard';

export const selectDashboardState =
  createFeatureSelector<DashboardState>(DASHBOARD_STATE_KEY);

export const selectNotificationsUnread = createSelector(
  selectDashboardState,
  (s): number => {
    const v = s.bySource['notifications']?.metrics?.['unread'];
    return typeof v === 'number' ? v : 0;
  }
);
