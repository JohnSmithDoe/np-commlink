import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, from, map, of, switchMap } from 'rxjs';
import { IListSettings } from '../../model';
import { DatabaseService } from '../../../@shared/util/database.service';
import { ListSettingsActions } from './list-settings.actions';

// Own-data load for the grocery-owned (lazy) listSettings slice: on `load` from
// its route resolver — NOT at boot — reads the `listSettings` key and emits `loaded`.
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
