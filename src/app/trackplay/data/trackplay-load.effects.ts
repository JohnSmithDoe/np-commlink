import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, from, map, of, switchMap } from 'rxjs';
import { ITrackplayState } from '../model';
import { DatabaseService } from '../../@shared/util/database.service';
import { TrackplayActions } from './trackplay.actions';

// Own-data load for the trackplay context (lazy-modules plan §4). Reads the
// `trackplay` key and emits `loaded`; the reducer hydrates on it (seeding the
// default game types when the loaded slice has none).
@Injectable({ providedIn: 'root' })
export class TrackplayLoadEffects {
  readonly #actions$ = inject(Actions);
  readonly #database = inject(DatabaseService);

  load$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(TrackplayActions.load),
      switchMap(() =>
        from(this.#database.load<ITrackplayState>('trackplay')).pipe(
          map((trackplay) => TrackplayActions.loaded(trackplay)),
          catchError(() => of(TrackplayActions.loaded(null)))
        )
      )
    );
  });
}
