import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { map, tap, withLatestFrom } from 'rxjs';
import { DatabaseService } from '../../../@shared/util/database.service';
import { OfficeTimeSettingsActions } from './settings.actions';
import { selectOfficeTimeSettingsState } from './settings.selector';

@Injectable({ providedIn: 'root' })
export class OfficeTimeSettingsEffects {
  #actions$ = inject(Actions);
  #store = inject(Store);
  #database = inject(DatabaseService);
  toggleFlag$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(OfficeTimeSettingsActions.toggleFlag),
      withLatestFrom(this.#store.select(selectOfficeTimeSettingsState)),
      map(([{ flag }, settings]) =>
        OfficeTimeSettingsActions.updateSettings({
          ...settings,
          [flag]: !settings[flag],
        })
      )
    );
  });

  saveSettingsOnChange$ = createEffect(
    () => {
      return this.#actions$.pipe(
        ofType(OfficeTimeSettingsActions.updateSettings),
        tap(({ settings }) => {
          void this.#database.save('officeTimeSettings', settings);
        })
      );
    },
    { dispatch: false }
  );
}
