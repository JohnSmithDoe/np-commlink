import { createReducer, on } from '@ngrx/store';
import { IDashboardState } from '../model';
import { DashboardActions } from '../../@shared/data/dashboard/dashboard.actions';
import { DashboardReadModelActions } from './dashboard.actions';

// Dashboard read-model (CQRS materialized view). Latest telemetry wins per
// source. Seeded at boot from the persisted `npc-summary-*` docs via `hydrate`
// (at `standby`); a live `report` then flips a source to `online`. `status` is
// therefore STRUCTURALLY ephemeral — it can only ever become `online` through
// a live report, which only happens once that module's reporter registers
// (lazy-modules plan §3). Nothing needs to strip it on the way to disk.
export const initialDashboardState: IDashboardState = { bySource: {} };

export const dashboardReducer = createReducer(
  initialDashboardState,
  on(DashboardActions.report, (state, { telemetry }) => ({
    bySource: {
      ...state.bySource,
      [telemetry.source]: { ...telemetry, status: 'online' as const },
    },
  })),
  on(DashboardReadModelActions.hydrate, (_state, { summaries }) => ({
    bySource: Object.fromEntries(
      summaries.map((summary) => [
        summary.source,
        { ...summary, status: 'standby' as const },
      ])
    ),
  }))
);
