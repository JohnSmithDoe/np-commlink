import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, from, map, of, switchMap } from 'rxjs';
import { ITasksState } from '../../@shared/types';
import { DatabaseService } from '../../@shared/util/database.service';
import { TasksActions } from './tasks.actions';

// Own-data load for the tasks context (lazy-modules plan §4). Reads only the
// `tasks` key on route entry and emits `loaded`; the reducer hydrates on it. On
// a storage failure it still emits `loaded(null)` so the resolver unblocks.
@Injectable({ providedIn: 'root' })
export class TasksLoadEffects {
  readonly #actions$ = inject(Actions);
  readonly #database = inject(DatabaseService);

  load$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(TasksActions.load),
      switchMap(() =>
        from(this.#database.load<ITasksState>('tasks')).pipe(
          map((tasks) => TasksActions.loaded(tasks)),
          catchError(() => of(TasksActions.loaded(null)))
        )
      )
    );
  });
}
