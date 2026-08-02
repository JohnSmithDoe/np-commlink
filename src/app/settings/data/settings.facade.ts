import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { AccentColors, Language, Theme } from '../../@shared/model/app.types';
import { SettingsActions } from './settings.actions';
import {
  selectCustomAccents,
  selectLanguage,
  selectTheme,
} from './settings.selector';

@Injectable({ providedIn: 'root' })
export class SettingsFacade {
  readonly #store = inject(Store);

  readonly theme = this.#store.selectSignal(selectTheme);
  readonly language = this.#store.selectSignal(selectLanguage);
  readonly customAccents = this.#store.selectSignal(selectCustomAccents);

  setTheme(theme: Theme): void {
    this.#store.dispatch(SettingsActions.setTheme(theme));
  }

  setLanguage(language: Language): void {
    this.#store.dispatch(SettingsActions.setLanguage(language));
  }

  setAccentColors(theme: Theme, colors: AccentColors): void {
    this.#store.dispatch(SettingsActions.setAccentColors(theme, colors));
  }

  resetAccentColors(theme: Theme): void {
    this.#store.dispatch(SettingsActions.resetAccentColors(theme));
  }
}
