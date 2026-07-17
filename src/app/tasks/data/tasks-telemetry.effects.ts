import { inject, Injectable } from '@angular/core';
import { createEffect } from '@ngrx/effects';
import { createSelector, Store } from '@ngrx/store';
import { map } from 'rxjs';
import { DashboardActions } from '../../@shared/util/dashboard/dashboard.actions';
import { selectTasksState } from './tasks.selector';

// Count of open tasks for the deck's AGENDA tile. Tasks have no completion
// state (they are deleted when done), so every item in the list is "open".
export const selectOpenTaskCount = createSelector(
  selectTasksState,
  (state) => state?.items.length ?? 0
);

// Telemetry inversion (§4, CQRS): tasks *pushes* its open-task count to the
// shared dashboard read-model. LAZY — registered with the tasks slice on route
// entry (provide-tasks-lazy). Imports only its own selector + the @shared
// contract; commlink never imports here.
@Injectable({ providedIn: 'root' })
export class TasksTelemetryEffects {
  readonly #store = inject(Store);

  report$ = createEffect(() => {
    return this.#store
      .select(selectOpenTaskCount)
      .pipe(
        map((open) =>
          DashboardActions.report({ source: 'tasks', metrics: { open } })
        )
      );
  });
}
