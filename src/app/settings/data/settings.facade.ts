import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  IAccentColors,
  TLanguage,
  TTheme,
} from '../../@shared/model/app.types';
import { SettingsActions } from './actions/settings.actions';
import {
  selectCustomAccents,
  selectLanguage,
  selectTheme,
} from './selectors/settings.selector';

/**
 * Facade over the eager, app-global `settings` slice: the selected UI `theme`
 * with its optional accent overrides, and the UI `language`. Components
 * read/set them through this instead of injecting `Store`; the settings effects
 * mirror each change onto the document (`<html data-theme>` / `<html lang>` plus
 * the translate bundle).
 *
 * The slice is eager because the theme must reach `<html data-theme>` while the
 * boot splash still covers the first paint. It holds no schema `version` — that
 * is `APP_VERSION` (`@shared/model/app.consts`), stamped into each doc's
 * envelope on save.
 */
@Injectable({ providedIn: 'root' })
export class SettingsFacade {
  readonly #store = inject(Store);

  readonly theme = this.#store.selectSignal(selectTheme);
  readonly language = this.#store.selectSignal(selectLanguage);
  readonly customAccents = this.#store.selectSignal(selectCustomAccents);

  setTheme(theme: TTheme): void {
    this.#store.dispatch(SettingsActions.setTheme(theme));
  }

  setLanguage(language: TLanguage): void {
    this.#store.dispatch(SettingsActions.setLanguage(language));
  }

  setAccentColors(theme: TTheme, colors: IAccentColors): void {
    this.#store.dispatch(SettingsActions.setAccentColors(theme, colors));
  }

  resetAccentColors(theme: TTheme): void {
    this.#store.dispatch(SettingsActions.resetAccentColors(theme));
  }
}
