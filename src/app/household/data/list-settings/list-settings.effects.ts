import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { concatLatestFrom } from '@ngrx/operators';
import { Store } from '@ngrx/store';
import { map } from 'rxjs';
import { ListSettingsActions } from './list-settings.actions';
import { selectListSettingsState } from './list-settings.selector';

@Injectable({ providedIn: 'root' })
export class ListSettingsEffects {
  readonly #actions$ = inject(Actions);
  readonly #store = inject(Store);
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
}
