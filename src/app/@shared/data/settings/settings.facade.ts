import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { TTheme } from '../../model/types';
import { SettingsActions } from './settings.actions';
import { selectTheme } from './settings.selector';

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

  setTheme(theme: TTheme): void {
    this.#store.dispatch(SettingsActions.setTheme(theme));
  }
}
