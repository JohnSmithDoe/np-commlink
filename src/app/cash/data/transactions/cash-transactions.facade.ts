import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { ItemDialogService } from '../../../@shared/data/item-lists/item-dialog.service';
import { CategoryId } from '../../../@shared/model/category.types';
import { CASH_TRANSACTIONS_LIST_ID } from '../../model/cash.types';
import { CashTransaction } from '../../model/transaction.types';
import { createCashTransaction } from '../../util/cash.factory';
import { CashRecategorization } from '../../util/categorize.utils';
import { ImportConfirmation } from '../../util/import/plan-import';
import { CashTransactionsActions } from './cash-transactions.actions';
import { selectAllTransactions } from '../cash.selector';

@Injectable({ providedIn: 'root' })
export class CashTransactionsFacade {
  readonly #store = inject(Store);
  readonly #dialogs = inject(ItemDialogService);

  showCreateDialog(accountId: string, categoryId?: CategoryId): void {
    this.#dialogs.open({
      item: createCashTransaction('', accountId, categoryId),
      listId: CASH_TRANSACTIONS_LIST_ID,
      editMode: 'create',
    });
  }

  showEditDialog(item: CashTransaction): void {
    this.#dialogs.open({
      item,
      listId: CASH_TRANSACTIONS_LIST_ID,
      editMode: 'update',
    });
  }

  readonly allItems = this.#store.selectSignal(selectAllTransactions);

  saveItem(item: CashTransaction): void {
    const isKnown = this.allItems().some(({ id }) => id === item.id);
    this.#store.dispatch(
      isKnown
        ? CashTransactionsActions.updateItem(item)
        : CashTransactionsActions.addItem(item)
    );
  }

  removeItem(item: CashTransaction): void {
    this.#store.dispatch(CashTransactionsActions.removeItem(item));
  }

  importItems(items: CashTransaction[], confirmed: ImportConfirmation[]): void {
    this.#store.dispatch(CashTransactionsActions.importItems(items, confirmed));
  }

  bookTransfer(fromLeg: CashTransaction, toLeg: CashTransaction): void {
    this.#store.dispatch(CashTransactionsActions.bookTransfer(fromLeg, toLeg));
  }

  recategorize(changes: CashRecategorization[]): void {
    this.#store.dispatch(CashTransactionsActions.recategorize(changes));
  }

  reconcile(manualId: string, importedId: string): void {
    this.#store.dispatch(
      CashTransactionsActions.reconcile(manualId, importedId)
    );
  }

  unreconcile(manualId: string): void {
    this.#store.dispatch(CashTransactionsActions.unreconcile(manualId));
  }
}
