import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { TTheme } from '../../@shared/model/app.types';
import { IAccentColors } from '../../@shared/model/settings.types';
import { SettingsActions } from './actions/settings.actions';
import {
  selectCustomAccents,
  selectTheme,
} from './selectors/settings.selector';

/**
 * Facade over the eager, app-global `settings` kernel slice (the persisted
 * schema `version` anchor + the selected UI `theme`). Components read/set the
 * theme through this instead of injecting `Store`; `SettingsEffects.applyTheme$`
 * mirrors the change onto `<html data-theme>`.
 */
@Injectable({ providedIn: 'root' })
export class SettingsFacade {
  readonly #store = inject(Store);

  readonly theme = this.#store.selectSignal(selectTheme);
  readonly customAccents = this.#store.selectSignal(selectCustomAccents);

  setTheme(theme: TTheme): void {
    this.#store.dispatch(SettingsActions.setTheme(theme));
  }

  setAccentColors(theme: TTheme, colors: IAccentColors): void {
    this.#store.dispatch(SettingsActions.setAccentColors(theme, colors));
  }

  resetAccentColors(theme: TTheme): void {
    this.#store.dispatch(SettingsActions.resetAccentColors(theme));
  }
}
