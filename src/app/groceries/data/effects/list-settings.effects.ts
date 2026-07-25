import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { concatLatestFrom } from '@ngrx/operators';
import { Store } from '@ngrx/store';
import { map, tap } from 'rxjs';
import { DatabaseService } from '../../../@shared/util/db/database.service';
import { ListSettingsActions } from '../list-settings/list-settings.actions';
import { selectListSettingsState } from '../list-settings/list-settings.selector';

@Injectable({ providedIn: 'root' })
export class ListSettingsEffects {
  #actions$ = inject(Actions);
  #store = inject(Store);
  #database = inject(DatabaseService);
  toggleFlag$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(ListSettingsActions.toggleFlag),
      concatLatestFrom(() => this.#store.select(selectListSettingsState)),
      map(([{ flag }, settings]) =>
        ListSettingsActions.updateSettings({
          ...settings,
          [flag]: !settings[flag],
        })
      )
    );
  });

  saveSettingsOnChange$ = createEffect(
    () => {
      return this.#actions$.pipe(
        ofType(ListSettingsActions.updateSettings),
        tap(({ settings }) => {
          void this.#database.save('listSettings', settings);
        })
      );
    },
    { dispatch: false }
  );
}
