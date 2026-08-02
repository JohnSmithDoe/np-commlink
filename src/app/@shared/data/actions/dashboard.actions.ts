import { createActionGroup } from '@ngrx/store';

import { DashboardTelemetry } from '../../model/dashboard.types';

export const DashboardActions = createActionGroup({
  source: 'Dashboard',
  events: {
    report: (telemetry: DashboardTelemetry) => ({ telemetry }),
  },
});
