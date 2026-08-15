/* ─── why ─────────────────────────────────────────────────────────
 * No `catalog`: an account is not filed under a category, so
 * `ListPageComponent` renders no chip bar and no manage button, and with no
 * chips nothing can reach `selectCategory`. That absence is the whole
 * statement — the action group goes to `itemListCommands` whole, because
 * hand-picking three of its four fields to withhold `updateFilter` was a
 * second way of saying the same thing, and two statements can drift.
 * ───────────────────────────────────────────────────────────────── */
import { inject, Injectable, signal } from '@angular/core';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { Store } from '@ngrx/store';
import {
  BaseListPageFacade,
  itemListCommands,
} from '../../../@shared/data/item-lists/list-page.facade.base';
import { ItemListSortOption } from '../../../@shared/model/item-list.types';
import { CashAccountsActions } from './cash-accounts.actions';
import { CashAccountsFacade } from './cash-accounts.facade';
import {
  selectAccountsSearchResult,
  selectAccountsState,
  selectAccountsWithBalances,
} from './cash-accounts.selector';

const SORT_OPTIONS: readonly ItemListSortOption[] = [
  { type: 'createdAt', labelKey: marker('cash.list-toolbar.created') },
];

@Injectable({ providedIn: 'root' })
export class CashAccountsPageFacade extends BaseListPageFacade {
  readonly #store = inject(Store);
  readonly #accounts = inject(CashAccountsFacade);

  protected readonly commands = itemListCommands(
    this.#store,
    CashAccountsActions
  );

  readonly state = this.#store.selectSignal(selectAccountsState);
  readonly items = this.#store.selectSignal(selectAccountsWithBalances);
  readonly searchResult = this.#store.selectSignal(selectAccountsSearchResult);
  readonly sortOptions = signal(SORT_OPTIONS);

  showCreateDialog(): void {
    this.#accounts.showCreateDialog(this.state().searchQuery ?? '');
  }
}
