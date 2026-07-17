import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, from, map, of, switchMap } from 'rxjs';
import { ITrackingState } from '../../@shared/types';
import { DatabaseService } from '../../@shared/util/database.service';
import { TrackingActions } from './tracking.actions';

// Own-data load for the tracking context (lazy-modules plan §4). Reads only the
// `tracking` key and emits `loaded`; the reducer + trackTime$ hydrate on it. On
// a storage failure it still emits `loaded(null)`.
@Injectable({ providedIn: 'root' })
export class TrackingLoadEffects {
  readonly #actions$ = inject(Actions);
  readonly #database = inject(DatabaseService);

  load$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(TrackingActions.load),
      switchMap(() =>
        from(this.#database.load<ITrackingState>('tracking')).pipe(
          map((tracking) => TrackingActions.loaded(tracking)),
          catchError(() => of(TrackingActions.loaded(null)))
        )
      )
    );
  });
}
