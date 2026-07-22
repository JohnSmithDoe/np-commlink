import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { concatLatestFrom } from '@ngrx/operators';
import { Store } from '@ngrx/store';
import { catchError, filter, from, map, of, switchMap, tap } from 'rxjs';
import { ISettings } from '../../types';
import { DatabaseService } from '../../util/database.service';
import { SplashService } from '../../util/splash.service';
import { ThemeService } from '../../util/theme.service';
import { initialSettings } from './settings.reducer';
import { SettingsActions } from './settings.actions';
import { selectSettingsState } from './settings.selector';

// Own-data load for the eager app-global settings slice. Reads the `settings`
// key at boot and emits `loaded`; on a fresh install (no doc) it seeds the
// current schema VERSION to disk so the migration framework has an on-disk
// anchor to read when a real migration step is added.
@Injectable({ providedIn: 'root' })
export class SettingsEffects {
  readonly #actions$ = inject(Actions);
  readonly #store = inject(Store);
  readonly #database = inject(DatabaseService);
  readonly #theme = inject(ThemeService);
  readonly #splash = inject(SplashService);

  load$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(SettingsActions.load),
      switchMap(() =>
        from(this.#database.load<ISettings>('settings')).pipe(
          map((settings) => SettingsActions.loaded(settings)),
          catchError(() => of(SettingsActions.loaded(null)))
        )
      )
    );
  });

  // Seed the version doc on first run (the reducer keeps `initialSettings` when
  // the key is absent, so this is what actually writes it to disk).
  seed$ = createEffect(
    () => {
      return this.#actions$.pipe(
        ofType(SettingsActions.loaded),
        filter(({ settings }) => settings == undefined),
        tap(() => void this.#database.save('settings', initialSettings))
      );
    },
    { dispatch: false }
  );

  // The store→DOM theme bridge (data → util) so ThemeService stays Store-free.
  // Applies <html data-theme> whenever settings hydrate or the theme changes.
  // Registered before revealSplash$ so data-theme is set before the splash lifts.
  applyTheme$ = createEffect(
    () => {
      return this.#actions$.pipe(
        ofType(SettingsActions.loaded, SettingsActions.setTheme),
        concatLatestFrom(() => this.#store.select(selectSettingsState)),
        tap(([, settings]) => this.#theme.apply(settings.theme))
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

  persistTheme$ = createEffect(
    () => {
      return this.#actions$.pipe(
        ofType(SettingsActions.setTheme),
        concatLatestFrom(() => this.#store.select(selectSettingsState)),
        tap(([, settings]) => void this.#database.save('settings', settings))
      );
    },
    { dispatch: false }
  );
}
