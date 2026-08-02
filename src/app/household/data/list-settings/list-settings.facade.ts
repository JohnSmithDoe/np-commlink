import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { BooleanKeys, ListSettings } from '../../model/list-settings.types';
import { ListSettingsActions } from './list-settings.actions';
import { selectListSettingsState } from './list-settings.selector';

@Injectable({ providedIn: 'root' })
export class ListSettingsFacade {
  readonly #store = inject(Store);

  readonly settings = this.#store.selectSignal(selectListSettingsState);

  toggleFlag(flag: BooleanKeys<ListSettings>): void {
    this.#store.dispatch(ListSettingsActions.toggleFlag(flag));
  }
}
