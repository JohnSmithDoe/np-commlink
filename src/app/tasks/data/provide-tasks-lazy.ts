import { EnvironmentProviders, Provider } from '@angular/core';
import { provideEffects } from '@ngrx/effects';
import { provideState } from '@ngrx/store';
import { tasksReducer } from './tasks.reducer';
import { TasksEffects } from './tasks.effects';
import { TasksTelemetryEffects } from './tasks-telemetry.effects';
import { TasksLoadEffects } from './tasks-load.effects';
import { TasksSaveEffects } from './tasks-save.effects';
import { TasksListEffects } from './tasks-list.effects';
import { TasksItemDialogsEffects } from './tasks-item-dialogs.effects';

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
    // Tasks' OWN switch-free item-flow + dialog orchestration, folded off the
    // eager shell GroceryListEffects/ItemDialogsEffects (lazy-modules §2b).
    // Separate classes (not the grocery ones) so a grocery↔tasks transition
    // can't double-dispatch, and so tasks imports nothing from groceries/.
    TasksListEffects,
    TasksItemDialogsEffects
  ),
];
