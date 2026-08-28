import { computed, inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { BooleanKeys, ListSettings } from '../../model/list-settings.types';
import {
  ROUTE_BY_LIST_ID,
  TITLE_KEY_BY_LIST_ID,
} from '../../util/household-list.utils';
import { selectActiveHouseholdListId } from '../list/household-list.selector';
import { ListSettingsActions } from './list-settings.actions';
import { selectListSettingsState } from './list-settings.selector';

@Injectable({ providedIn: 'root' })
export class ListSettingsFacade {
  readonly #store = inject(Store);
  readonly #activeListId = this.#store.selectSignal(
    selectActiveHouseholdListId
  );

  readonly settings = this.#store.selectSignal(selectListSettingsState);
  readonly listHref = computed(() => ROUTE_BY_LIST_ID[this.#activeListId()]);
  readonly listTitleKey = computed(
    () => TITLE_KEY_BY_LIST_ID[this.#activeListId()]
  );

  toggleFlag(flag: BooleanKeys<ListSettings>): void {
    this.#store.dispatch(ListSettingsActions.toggleFlag(flag));
  }
}
