import { createActionGroup, emptyProps } from '@ngrx/store';
import { DashboardSummary } from '../../model/dashboard.types';

export const DashboardReadModelActions = createActionGroup({
  source: 'Dashboard',
  events: {
    load: emptyProps(),
    hydrate: (summaries: DashboardSummary[]) => ({ summaries }),
  },
});
