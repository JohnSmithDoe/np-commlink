import { EnvironmentProviders, Provider } from '@angular/core';
import { provideEffects } from '@ngrx/effects';
import { provideState } from '@ngrx/store';
import { tasksReducer } from './tasks.reducer';
import { TasksEffects } from './tasks.effects';

/**
 * Lazy state + effects for the `tasks` domain, registered on the `tasks` route.
 *
 * `tasks` is self-contained — it shares no data with the grocery cluster and
 * its selectors read only `state.tasks` — so it registers on its own and needs
 * no co-registration. Hydration is handled by `datastoreHydrationResolver` on
 * the same route.
 */
export const tasksLazyProviders: Array<Provider | EnvironmentProviders> = [
  provideState('tasks', tasksReducer),
  provideEffects(TasksEffects),
];
