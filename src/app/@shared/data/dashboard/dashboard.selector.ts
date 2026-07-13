import { createFeatureSelector, createSelector } from '@ngrx/store';
import { IDashboardState } from '../../types';

export const selectDashboardState =
  createFeatureSelector<IDashboardState>('dashboard');

export const selectTelemetry = (source: string) =>
  createSelector(selectDashboardState, (s) => s.bySource[source]);
