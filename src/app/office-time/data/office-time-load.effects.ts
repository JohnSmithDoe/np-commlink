import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, from, map, of, switchMap } from 'rxjs';
import { IOfficeTimeStateStorage, ISettingsState } from '../../@shared/types';
import { DatabaseService } from '../../@shared/util/database.service';
import { SettingsActions } from './settings/settings.actions';
import { OfficeTimeActions } from './office-time/office-time.actions';

// Own-data load for the office-time bounded context (lazy-modules plan §4). The
// context owns two slices (settings + officeTime) with their own reducers, so
// there are two load effects — one per slice/key — colocated here.
@Injectable({ providedIn: 'root' })
export class OfficeTimeLoadEffects {
  readonly #actions$ = inject(Actions);
  readonly #database = inject(DatabaseService);

  settings$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(SettingsActions.load),
      switchMap(() =>
        from(this.#database.load<ISettingsState>('settings')).pipe(
          map((settings) => SettingsActions.loaded(settings)),
          catchError(() => of(SettingsActions.loaded(null)))
        )
      )
    );
  });

  officeTime$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(OfficeTimeActions.load),
      switchMap(() =>
        from(this.#database.load<IOfficeTimeStateStorage>('officeTime')).pipe(
          map((officeTime) => OfficeTimeActions.loaded(officeTime)),
          catchError(() => of(OfficeTimeActions.loaded(null)))
        )
      )
    );
  });
}
