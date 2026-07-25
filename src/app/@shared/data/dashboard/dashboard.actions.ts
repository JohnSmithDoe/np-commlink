import { createActionGroup } from '@ngrx/store';
import { IDashboardTelemetry } from '../../model/types';

// Published dashboard-telemetry contract (§4) — the WRITE side, and the only
// part of the dashboard that belongs to @shared. Every program *reports* its
// summary here; it does not know or care who reads it.
//
// The read-model that consumes this — reducer, selectors, facade, persistence,
// and its own `load`/`hydrate` lifecycle (`DashboardReadModelActions` in
// `commlink/data`) — is owned by commlink, since the deck and the shell badge
// are its only readers. Keeping just this group shared is what makes the
// inversion work: suppliers dispatch a @shared action, nobody imports commlink.
// `hydrate` in particular could not live here — it carries IDashboardSummary,
// a commlink type @shared may not name.
export const DashboardActions = createActionGroup({
  source: 'Dashboard',
  events: {
    report: (telemetry: IDashboardTelemetry) => ({ telemetry }),
  },
});
