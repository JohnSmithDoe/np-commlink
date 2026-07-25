import { EnvironmentProviders, Provider } from '@angular/core';
import { provideEffects } from '@ngrx/effects';
import { provideState } from '@ngrx/store';
import { moduleHydrationResolver } from '../../@shared/data/module-hydration.resolver';
import { TasksActions } from './tasks.actions';
import { tasksReducer } from './tasks.reducer';
import { TasksEffects } from './effects/tasks.effects';
import { TasksTelemetryEffects } from './effects/tasks-telemetry.effects';
import { TasksLoadEffects } from './effects/tasks-load.effects';
import { TasksSaveEffects } from './effects/tasks-save.effects';
import { TasksListEffects } from './effects/tasks-list.effects';

/**
 * Lazy state + effects for the `tasks` domain, registered on the `tasks` route.
 *
 * `tasks` is self-contained — it shares no data with the grocery cluster and
 * its selectors read only `state.tasks` — so it registers on its own and needs
 * no co-registration. Hydration is handled by `moduleHydrationResolver(
 * TasksActions.load, .loaded)` on the same route: TasksLoadEffects reads the
 * `tasks` key and emits `loaded`. TasksSaveEffects (own-data save, moved off
 * the eager shell — lazy-modules Phase E) and TasksTelemetryEffects ride with
 * the slice so their store reads never hit an unregistered slice; cold-launch
 * value comes from the persisted summary, on-entry report flips the tile
 * standby→online.
 */
export const tasksLazyProviders: Array<Provider | EnvironmentProviders> = [
  provideState('tasks', tasksReducer),
  provideEffects(
    TasksLoadEffects,
    TasksSaveEffects,
    TasksEffects,
    TasksTelemetryEffects,
    // Tasks' OWN switch-free item-flow orchestration, folded off the eager shell
    // GroceryListEffects (lazy-modules §2b). A separate class (not the grocery
    // one) so a grocery↔tasks transition can't double-dispatch, and so tasks
    // imports nothing from groceries/.
    TasksListEffects
  ),
];

/** Route hydration for the tasks slice (dispatched by the route resolver). */
export const tasksHydrationResolver = moduleHydrationResolver(
  TasksActions.load,
  TasksActions.loaded
);
