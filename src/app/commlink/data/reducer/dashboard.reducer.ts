import { createReducer, on } from '@ngrx/store';
import { IDashboardState } from '../../model/dashboard.types';
import { DashboardActions } from '../../../@shared/data/actions/dashboard.actions';
import { DashboardReadModelActions } from '../actions/dashboard.actions';

// Dashboard read-model (CQRS materialized view). Latest telemetry wins per
// source. Seeded at boot from the persisted `npc-summary-*` docs via `hydrate`
// (at `standby`); a live `report` then flips a source to `online`. `status` is
// therefore STRUCTURALLY ephemeral — it can only ever become `online` through
// a live report, which only happens once that module's reporter registers.
// Nothing needs to strip it on the way to disk.
export const initialDashboardState: IDashboardState = { bySource: {} };

export const dashboardReducer = createReducer(
  initialDashboardState,
  on(DashboardActions.report, (state, { telemetry }): IDashboardState => ({
    bySource: {
      ...state.bySource,
      [telemetry.source]: { ...telemetry, status: 'online' as const },
    },
  })),
  // Hydration fills the GAPS, it doesn't overwrite: an eager reporter registers
  // before this storage read resolves, so a source may already carry a live
  // report by now — and a report read the slice, which is fresher than the doc.
  // (Overwriting made an eager reporter's count revert to its persisted value at
  // `standby` for the rest of the session, since `select` only re-emits on
  // change.) `hydrate` fires exactly once at boot, so "already in state" can
  // only mean "reported live".
  on(
    DashboardReadModelActions.hydrate,
    (state, { summaries }): IDashboardState => ({
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
