import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { concatLatestFrom } from '@ngrx/operators';
import { from, switchMap, tap } from 'rxjs';
import { Store } from '@ngrx/store';
import { AppReloadService } from '../../@shared/util/service-worker/app-reload.service';
import { DatabaseService } from '../../@shared/util/persistence/database.service';
import { LanguageService } from '../../@shared/util/theme/language.service';
import { SplashService } from '../../@shared/util/services/splash.service';
import { ThemeService } from '../../@shared/util/theme/theme.service';
import { EmojiRecentsService } from '../../@shared/util/emoji/emoji-recents.service';
import { SettingsActions } from './settings.actions';
import { selectRecentEmojis, selectSettingsState } from './settings.selector';

@Injectable({ providedIn: 'root' })
export class SettingsEffects {
  readonly #actions$ = inject(Actions);
  readonly #store = inject(Store);
  readonly #theme = inject(ThemeService);
  readonly #language = inject(LanguageService);
  readonly #database = inject(DatabaseService);
  readonly #reload = inject(AppReloadService);
  readonly #splash = inject(SplashService);
  readonly #emojiRecents = inject(EmojiRecentsService);

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
        tap(([action, settings]) => {
          this.#theme.apply(
            settings.theme,
            settings.customAccents?.[settings.theme]
          );
          if (action.type === SettingsActions.loaded.type) {
            this.#splash.reveal();
          }
        })
      );
    },
    { dispatch: false }
  );

  applyLanguage$ = createEffect(
    () => {
      return this.#actions$.pipe(
        ofType(SettingsActions.loaded, SettingsActions.setLanguage),
        concatLatestFrom(() => this.#store.select(selectSettingsState)),
        tap(([, settings]) => this.#language.apply(settings.language))
      );
    },
    { dispatch: false }
  );

  publishRecentEmojis$ = createEffect(
    () => {
      return this.#store
        .select(selectRecentEmojis)
        .pipe(tap((glyphs) => this.#emojiRecents.publish(glyphs)));
    },
    { dispatch: false }
  );

  restartOnLanguageChange$ = createEffect(
    () => {
      return this.#actions$.pipe(
        ofType(SettingsActions.setLanguage),
        switchMap(() => from(this.#database.settled())),
        tap(() => this.#reload.reload())
      );
    },
    { dispatch: false }
  );
}
