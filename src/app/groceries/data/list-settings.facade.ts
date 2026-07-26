import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { BooleanKeys, IListSettings } from '../model/list-settings.types';
import { ListSettingsActions } from './actions/list-settings.actions';
import { selectListSettingsState } from './selectors/list-settings.selector';

/**
 * Facade for the grocery `listSettings` feature-flags slice. Kept separate from
 * {@link GroceryListPageFacade} on purpose: the `/list-settings` route registers
 * ONLY the `listSettings` slice (via `listSettingsProviders`), so the page
 * must not inject the full grocery facade — its grocery-list selectors would run
 * against unregistered shopping/storage/products slices.
 */
@Injectable({ providedIn: 'root' })
export class ListSettingsFacade {
  readonly #store = inject(Store);

  readonly settings = this.#store.selectSignal(selectListSettingsState);

  toggleFlag(flag: BooleanKeys<IListSettings>): void {
    this.#store.dispatch(ListSettingsActions.toggleFlag(flag));
  }
}
