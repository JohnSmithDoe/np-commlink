import { createReducer, on } from '@ngrx/store';
import { DashboardState } from '../../model/dashboard.types';
import { DashboardActions } from '../../../@shared/data/actions/dashboard.actions';
import { DashboardReadModelActions } from './dashboard.actions';

export const initialDashboardState: DashboardState = { bySource: {} };

export const dashboardReducer = createReducer(
  initialDashboardState,
  on(DashboardActions.report, (state, { telemetry }): DashboardState => ({
    bySource: {
      ...state.bySource,
      [telemetry.source]: { ...telemetry, status: 'online' as const },
    },
  })),
  on(
    DashboardReadModelActions.hydrate,
    (state, { summaries }): DashboardState => ({
      bySource: {
        ...Object.fromEntries(
          summaries.map((summary) => [
            summary.source,
            { ...summary, status: 'standby' as const },
          ])
        ),
        ...state.bySource,
      },
    })
  )
);
