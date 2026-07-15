import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, from, map, of, switchMap } from 'rxjs';
import { IListSettings } from '../../types';
import { DatabaseService } from '../../util/database.service';
import { ListSettingsActions } from './list-settings.actions';

// Own-data load for the eager shared-kernel listSettings slice (lazy-modules
// plan §4). Reads the `listSettings` key at boot and emits `loaded`.
@Injectable({ providedIn: 'root' })
export class ListSettingsLoadEffects {
  readonly #actions$ = inject(Actions);
  readonly #database = inject(DatabaseService);

  load$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(ListSettingsActions.load),
      switchMap(() =>
        from(this.#database.load<IListSettings>('listSettings')).pipe(
          map((listSettings) => ListSettingsActions.loaded(listSettings)),
          catchError(() => of(ListSettingsActions.loaded(null)))
        )
      )
    );
  });
}
