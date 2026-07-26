import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { concatLatestFrom } from '@ngrx/operators';
import { tap } from 'rxjs';
import { Store } from '@ngrx/store';
import { SplashService } from '../../../@shared/util/splash.service';
import { ThemeService } from '../../../@shared/util/theme.service';
import { SettingsActions } from '../actions/settings.actions';
import { selectSettingsState } from '../selectors/settings.selector';

// The app-global settings slice's own behaviour, beyond the load/save the
// context descriptor provides: mirror the theme onto <html data-theme>, and
// lift the boot splash once it has been applied.
@Injectable({ providedIn: 'root' })
export class SettingsEffects {
  readonly #actions$ = inject(Actions);
  readonly #store = inject(Store);
  readonly #theme = inject(ThemeService);
  readonly #splash = inject(SplashService);

  // The store→DOM theme bridge (data → util) so ThemeService stays Store-free.
  // Applies <html data-theme> whenever settings hydrate or the theme changes.
  // Registered before revealSplash$ so data-theme is set before the splash lifts.
  applyTheme$ = createEffect(
    () => {
      return this.#actions$.pipe(
        ofType(
          SettingsActions.loaded,
          SettingsActions.setTheme,
          SettingsActions.setAccentColors,
          SettingsActions.resetAccentColors
        ),
        concatLatestFrom(() => this.#store.select(selectSettingsState)),
        tap(([, settings]) =>
          this.#theme.apply(
            settings.theme,
            settings.customAccents?.[settings.theme]
          )
        )
      );
    },
    { dispatch: false }
  );

  // Lift the neutral boot splash once the persisted theme has hydrated + been
  // applied underneath it — no flash of the wrong theme.
  revealSplash$ = createEffect(
    () => {
      return this.#actions$.pipe(
        ofType(SettingsActions.loaded),
        tap(() => this.#splash.reveal())
      );
    },
    { dispatch: false }
  );
}
