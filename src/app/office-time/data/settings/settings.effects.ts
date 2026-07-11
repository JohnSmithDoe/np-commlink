import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { map, tap, withLatestFrom } from 'rxjs';
import { DatabaseService } from '../../../@shared/util/database.service';
import { settingsActions } from './settings.actions';
import { selectSettingsState } from './settings.selector';

@Injectable({ providedIn: 'root' })
export class SettingsEffects {
  #actions$ = inject(Actions);
  #store = inject(Store);
  #database = inject(DatabaseService);
  toggleFlag$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(settingsActions.toggleFlag),
      withLatestFrom(this.#store.select(selectSettingsState)),
      map(([{ flag }, settings]) =>
        settingsActions.updateSettings({
          ...settings,
          [flag]: !settings[flag],
        })
      )
    );
  });

  saveSettingsOnChange$ = createEffect(
    () => {
      return this.#actions$.pipe(
        ofType(settingsActions.updateSettings),
        tap(({ settings }) => {
          void this.#database.save('settings', settings);
        })
      );
    },
    { dispatch: false }
  );
}
