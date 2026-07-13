import { createReducer, on } from '@ngrx/store';
import { IDashboardState } from '../../types';
import { DashboardActions } from './dashboard.actions';

// Dashboard read-model (CQRS materialized view). EPHEMERAL: it is rebuilt by
// live push each run, so it hydrates NOTHING on loadedSuccessfully and is NOT
// part of IDatastore — nothing to persist. Latest telemetry wins per source.
export const initialDashboardState: IDashboardState = { bySource: {} };

export const dashboardReducer = createReducer(
  initialDashboardState,
  on(DashboardActions.report, (state, { telemetry }) => ({
    bySource: { ...state.bySource, [telemetry.source]: telemetry },
  }))
);
