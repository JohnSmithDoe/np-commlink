import { createReducer, on } from '@ngrx/store';
import { IDashboardState } from '../../model/dashboard.types';
import { DashboardActions } from '../../../@shared/data/actions/dashboard.actions';
import { DashboardReadModelActions } from './dashboard.actions';

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
  // Hydration fills the GAPS, it doesn't overwrite. A reporter waits for its own
  // slice's `loaded` before it reports (`createTelemetrySliceEffect`), so a
  // source already in state by the time this boot read resolves carries a number
  // derived from that hydrated slice — fresher than the doc, which is the
  // previous session's. Overwriting parked such a source at its persisted value
  // at `standby` for the rest of the session, since `select` only re-emits on
  // change.
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
