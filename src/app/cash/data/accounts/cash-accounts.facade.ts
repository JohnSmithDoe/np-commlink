import { inject, Injectable, Signal } from '@angular/core';
import { Store } from '@ngrx/store';
import { ItemDialogService } from '../../../@shared/data/item-lists/item-dialog.service';
import { CashAccount } from '../../model/account.types';
import { CASH_ACCOUNTS_LIST_ID } from '../../model/cash.types';
import { createCashAccount } from '../../util/cash.factory';
import { CashAccountsActions } from './cash-accounts.actions';
import {
  AccountWithBalance,
  selectAccountById,
  selectAccountItems,
  selectAccountsWithBalances,
} from './cash-accounts.selector';
import { selectAccountBalances, selectNetWorthCents } from '../cash.selector';

@Injectable({ providedIn: 'root' })
export class CashAccountsFacade {
  readonly #store = inject(Store);
  readonly #dialogs = inject(ItemDialogService);

  readonly allItems = this.#store.selectSignal(selectAccountItems);
  readonly withBalances: Signal<AccountWithBalance[]> =
    this.#store.selectSignal(selectAccountsWithBalances);
  readonly netWorthCents = this.#store.selectSignal(selectNetWorthCents);
  readonly balances = this.#store.selectSignal(selectAccountBalances);

  accountById(id: string): Signal<CashAccount | undefined> {
    return this.#store.selectSignal(selectAccountById(id));
  }

  showCreateDialog(name = ''): void {
    this.#dialogs.open({
      item: createCashAccount(name),
      listId: CASH_ACCOUNTS_LIST_ID,
      editMode: 'create',
    });
  }

  showEditDialog(item: CashAccount): void {
    this.#dialogs.open({
      item,
      listId: CASH_ACCOUNTS_LIST_ID,
      editMode: 'update',
    });
  }

  saveItem(item: CashAccount): void {
    this.#store.dispatch(CashAccountsActions.addOrUpdateItem(item));
  }

  removeItem(item: CashAccount): void {
    this.#store.dispatch(CashAccountsActions.removeItem(item));
  }
}
