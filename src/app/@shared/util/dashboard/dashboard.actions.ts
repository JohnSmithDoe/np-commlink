import { createActionGroup, emptyProps } from '@ngrx/store';
import { IDashboardSummary, IDashboardTelemetry } from '../../types';

// Published dashboard-telemetry contract (§4). Every program *reports* its
// summary here; the eager dashboard read-model (CQRS) keeps the latest per
// source. Commlink reads only that read-model — it never imports a supplier
// domain. Suppliers dispatch this @shared action; nobody imports commlink.
//
// `load`/`hydrate` are the read-model's own persistence lifecycle (§3): `load`
// (dispatched once at boot) triggers DashboardEffects to read the persisted
// `npc-summary-*` docs; `hydrate` seeds the store from them at `standby`.
export const DashboardActions = createActionGroup({
  source: 'Dashboard',
  events: {
    report: (telemetry: IDashboardTelemetry) => ({ telemetry }),
    load: emptyProps(),
    hydrate: (summaries: IDashboardSummary[]) => ({ summaries }),
  },
});
