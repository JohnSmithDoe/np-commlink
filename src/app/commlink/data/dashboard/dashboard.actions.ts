import { createActionGroup, emptyProps } from '@ngrx/store';
import { IDashboardSummary } from '../../model/dashboard.types';

// The read-model's own persistence lifecycle, private to commlink — as
// opposed to the shared `DashboardActions.report` contract the nine supplier
// contexts dispatch. `load` (dispatched once at boot by provideAppInitializer)
// triggers DashboardEffects to read the persisted summary docs; `hydrate` seeds
// the store from them at `standby`.
//
// Same `source` string as the shared group on purpose: devtools then shows one
// coherent `[Dashboard] load / hydrate / report` timeline even though the
// contract and the read-model live in different modules.
export const DashboardReadModelActions = createActionGroup({
  source: 'Dashboard',
  events: {
    load: emptyProps(),
    hydrate: (summaries: IDashboardSummary[]) => ({ summaries }),
  },
});
