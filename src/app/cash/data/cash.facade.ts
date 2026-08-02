import { inject, Injectable, Signal } from '@angular/core';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { Category, CategoryId } from '../../@shared/model/category.types';
import { Store } from '@ngrx/store';
import { NotificationsActions } from '../../@shared/data/actions/notifications.actions';
import { CashAccount } from '../model/account.types';
import { CashRule } from '../model/rule.types';
import { CashTransaction } from '../model/transaction.types';
import { CashRecategorization } from '../util/categorize.utils';
import { CashActions } from './cash.actions';
import {
  selectAccountBalances,
  selectAccountById,
  selectAccountsWithBalances,
  selectCashAccounts,
  selectCashCategories,
  selectCashRules,
  selectCashTransactions,
  selectMonthlyTotals,
  selectNetWorthCents,
  selectReportTotals,
  selectSpendByCategory,
  selectTransactionsForAccount,
  selectTransactionsForCategory,
  AccountTransaction,
} from './cash.selector';

@Injectable({ providedIn: 'root' })
export class CashFacade {
  readonly #store = inject(Store);

  readonly accounts = this.#store.selectSignal(selectCashAccounts);
  readonly transactions = this.#store.selectSignal(selectCashTransactions);
  readonly categories = this.#store.selectSignal(selectCashCategories);
  readonly rules = this.#store.selectSignal(selectCashRules);
  readonly accountBalances = this.#store.selectSignal(selectAccountBalances);
  readonly accountsWithBalances = this.#store.selectSignal(
    selectAccountsWithBalances
  );
  readonly netWorthCents = this.#store.selectSignal(selectNetWorthCents);
  readonly monthlyTotals = this.#store.selectSignal(selectMonthlyTotals);
  readonly reportTotals = this.#store.selectSignal(selectReportTotals);
  readonly spendByCategory = this.#store.selectSignal(selectSpendByCategory);

  accountById(id: string): Signal<CashAccount | undefined> {
    return this.#store.selectSignal(selectAccountById(id));
  }

  transactionsForAccount(id: string): Signal<AccountTransaction[]> {
    return this.#store.selectSignal(selectTransactionsForAccount(id));
  }

  transactionsForCategory(id: string): Signal<CashTransaction[]> {
    return this.#store.selectSignal(selectTransactionsForCategory(id));
  }

  addAccount(account: CashAccount): void {
    this.#store.dispatch(CashActions.addAccount(account));
  }

  updateAccount(account: CashAccount): void {
    this.#store.dispatch(CashActions.updateAccount(account));
  }

  removeAccount(id: string): void {
    this.#store.dispatch(CashActions.removeAccount(id));
  }

  addTransaction(transaction: CashTransaction): void {
    this.#store.dispatch(CashActions.addTransaction(transaction));
  }

  updateTransaction(transaction: CashTransaction): void {
    this.#store.dispatch(CashActions.updateTransaction(transaction));
  }

  removeTransaction(id: string): void {
    this.#store.dispatch(CashActions.removeTransaction(id));
  }

  importTransactions(transactions: CashTransaction[]): void {
    this.#store.dispatch(CashActions.importTransactions(transactions));
  }

  bookTransfer(fromLeg: CashTransaction, toLeg: CashTransaction): void {
    this.#store.dispatch(CashActions.bookTransfer(fromLeg, toLeg));
  }

  setTransactionCategory(
    id: string,
    categoryId: CategoryId | undefined,
    manual: boolean
  ): void {
    this.#store.dispatch(
      CashActions.setTransactionCategory(id, categoryId, manual)
    );
  }

  recategorizeTransactions(changes: CashRecategorization[]): void {
    this.#store.dispatch(CashActions.recategorizeTransactions(changes));
  }

  reconcileTransaction(manualId: string, importedId: string): void {
    this.#store.dispatch(
      CashActions.reconcileTransaction(manualId, importedId)
    );
  }

  unreconcileTransaction(manualId: string): void {
    this.#store.dispatch(CashActions.unreconcileTransaction(manualId));
  }

  addCategory(category: Category): void {
    this.#store.dispatch(CashActions.addCategory(category));
  }

  removeCategory(id: CategoryId): void {
    this.#store.dispatch(CashActions.removeCategory(id));
  }

  updateCategory(id: CategoryId, name: string): void {
    this.#store.dispatch(CashActions.updateCategory(id, name));
  }

  addRule(rule: CashRule): void {
    this.#store.dispatch(CashActions.addRule(rule));
  }

  updateRule(rule: CashRule): void {
    this.#store.dispatch(CashActions.updateRule(rule));
  }

  removeRule(id: string): void {
    this.#store.dispatch(CashActions.removeRule(id));
  }

  reorderRules(ids: string[]): void {
    this.#store.dispatch(CashActions.reorderRules(ids));
  }

  reportRulesApplied(count: number): void {
    this.#store.dispatch(
      NotificationsActions.toast({
        key: marker('cash.rules.apply-result'),
        parameters: { count },
        color: 'medium',
      })
    );
  }
}
