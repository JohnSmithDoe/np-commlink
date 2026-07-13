import { createActionGroup } from '@ngrx/store';
import { IDashboardTelemetry } from '../../types';

// Published dashboard-telemetry contract (§4). Every program *reports* its
// summary here; the eager dashboard read-model (CQRS) keeps the latest per
// source. Commlink reads only that read-model — it never imports a supplier
// domain. Suppliers dispatch this @shared action; nobody imports commlink.
export const DashboardActions = createActionGroup({
  source: 'Dashboard',
  events: {
    report: (telemetry: IDashboardTelemetry) => ({ telemetry }),
  },
});
