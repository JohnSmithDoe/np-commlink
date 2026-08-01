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

// The app-global settings slice's own behaviour, beyond the load/save the
// context descriptor provides: mirror the theme onto <html data-theme>, the
// language onto the translate bundle + <html lang>, and lift the boot splash
// once the theme has been applied.
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

  // The store→DOM theme bridge (data → util) so ThemeService stays Store-free.
  // Applies <html data-theme> whenever settings hydrate or the theme changes,
  // and lifts the boot splash in the same tap once hydration has been applied
  // underneath it. The reveal lives here rather than in a sibling effect so the
  // ordering is structural: "theme applied, THEN splash lifted" is one statement
  // following another, not two effects whose declaration order has to be
  // trusted.
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

  // The same store→DOM bridge for the language. Separate from the theme effect
  // because they answer to different actions and neither ordering matters: a
  // language is applied by handing it to LanguageService, which owns all three
  // globals it touches (bundle, dayjs, <html lang>).
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

  /**
   * The same store→consumer bridge for the recents, and the reason
   * `EmojiRecentsService` can stay a plain signal holder: the emoji picker is
   * `@shared/ui` and may reach neither this slice nor `type:data` at all.
   *
   * Driven by the selector rather than by `ofType`, because every path that
   * changes the value matters equally — a save, and the boot hydration that
   * brings the persisted list back — and the selector already emits on both
   * without either being restated here.
   */
  publishRecentEmojis$ = createEffect(
    () => {
      return this.#store
        .select(selectRecentEmojis)
        .pipe(tap((glyphs) => this.#emojiRecents.publish(glyphs)));
    },
    { dispatch: false }
  );

  /**
   * Switching the language restarts the app.
   *
   * Not laziness — the alternative does not work. Money, score and date all
   * render through **pure** pipes, whose results are cached on input identity,
   * so a live locale change leaves them formatted for the language the user just
   * left; `LOCALE_ID` is a provider and cannot be re-resolved at all. A restart
   * makes every one of them correct at once, which is why the reload is the
   * feature rather than a workaround for it.
   *
   * It waits for `settled()` because the reload is irreversible: the doc is
   * written by the descriptor's save effect, which is registered *before* this
   * one and therefore has already issued the write by the time this handler
   * runs. Reloading without waiting would race it and drop the choice.
   */
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
