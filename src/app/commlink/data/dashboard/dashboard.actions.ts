import { createActionGroup, emptyProps } from '@ngrx/store';
import { DashboardSummary } from '../../model/dashboard.types';

export const DashboardReadModelActions = createActionGroup({
  source: 'Dashboard Read Model',
  events: {
    load: emptyProps(),
    hydrate: (summaries: DashboardSummary[]) => ({ summaries }),
  },
});
