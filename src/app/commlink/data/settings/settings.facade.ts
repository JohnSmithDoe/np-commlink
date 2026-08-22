import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  AccentColors,
  Language,
  Mode,
  Skin,
} from '../../../@shared/model/app.types';
import { SettingsActions } from './settings.actions';
import {
  selectCustomAccents,
  selectLanguage,
  selectMode,
  selectSkin,
} from './settings.selector';

@Injectable({ providedIn: 'root' })
export class SettingsFacade {
  readonly #store = inject(Store);

  readonly skin = this.#store.selectSignal(selectSkin);
  readonly mode = this.#store.selectSignal(selectMode);
  readonly language = this.#store.selectSignal(selectLanguage);
  readonly customAccents = this.#store.selectSignal(selectCustomAccents);

  setSkin(skin: Skin): void {
    this.#store.dispatch(SettingsActions.setSkin(skin));
  }

  setMode(mode: Mode): void {
    this.#store.dispatch(SettingsActions.setMode(mode));
  }

  setLanguage(language: Language): void {
    this.#store.dispatch(SettingsActions.setLanguage(language));
  }

  setAccentColors(skin: Skin, colors: AccentColors): void {
    this.#store.dispatch(SettingsActions.setAccentColors(skin, colors));
  }

  resetAccentColors(skin: Skin): void {
    this.#store.dispatch(SettingsActions.resetAccentColors(skin));
  }
}
