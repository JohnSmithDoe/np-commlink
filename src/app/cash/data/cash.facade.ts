import { inject, Injectable, Signal } from '@angular/core';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { ICategory, TCategoryId } from '../../@shared/model/category.types';
import { Store } from '@ngrx/store';
import { NotificationsActions } from '../../@shared/data/actions/notifications.actions';
import { ICashAccount } from '../model/account.types';
import { ICashRule } from '../model/rule.types';
import { ICashTransaction } from '../model/transaction.types';
import { ICashRecategorization } from '../util/categorize.utils';
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
  TAccountTxn,
} from './cash.selector';

/**
 * The `cash` (CREDSTICK) domain facade — the single NgRx surface for every cash
 * component (accounts overview, account ledger, category drill, report, rules,
 * and the six edit/import/reconcile/transfer modals). Injects `Store` so the
 * components never do. Route-scoped reads (an account's ledger, a category's
 * transactions) are exposed as factory methods returning a signal, since they
 * depend on a runtime id.
 */
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

  // Route-parameterised reads (called once from a component field initializer).
  accountById(id: string): Signal<ICashAccount | undefined> {
    return this.#store.selectSignal(selectAccountById(id));
  }

  transactionsForAccount(id: string): Signal<TAccountTxn[]> {
    return this.#store.selectSignal(selectTransactionsForAccount(id));
  }

  transactionsForCategory(id: string): Signal<ICashTransaction[]> {
    return this.#store.selectSignal(selectTransactionsForCategory(id));
  }

  // ── Accounts ─────────────────────────────────────────────────────────────
  addAccount(account: ICashAccount): void {
    this.#store.dispatch(CashActions.addAccount(account));
  }

  updateAccount(account: ICashAccount): void {
    this.#store.dispatch(CashActions.updateAccount(account));
  }

  removeAccount(id: string): void {
    this.#store.dispatch(CashActions.removeAccount(id));
  }

  // ── Transactions ─────────────────────────────────────────────────────────
  addTransaction(transaction: ICashTransaction): void {
    this.#store.dispatch(CashActions.addTransaction(transaction));
  }

  updateTransaction(transaction: ICashTransaction): void {
    this.#store.dispatch(CashActions.updateTransaction(transaction));
  }

  removeTransaction(id: string): void {
    this.#store.dispatch(CashActions.removeTransaction(id));
  }

  importTransactions(transactions: ICashTransaction[]): void {
    this.#store.dispatch(CashActions.importTransactions(transactions));
  }

  bookTransfer(fromLeg: ICashTransaction, toLeg: ICashTransaction): void {
    this.#store.dispatch(CashActions.bookTransfer(fromLeg, toLeg));
  }

  setTransactionCategory(
    id: string,
    categoryId: TCategoryId | undefined,
    manual: boolean
  ): void {
    this.#store.dispatch(
      CashActions.setTransactionCategory(id, categoryId, manual)
    );
  }

  recategorizeTransactions(changes: ICashRecategorization[]): void {
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

  // ── Categories ───────────────────────────────────────────────────────────
  addCategory(category: ICategory): void {
    this.#store.dispatch(CashActions.addCategory(category));
  }

  removeCategory(id: TCategoryId): void {
    this.#store.dispatch(CashActions.removeCategory(id));
  }

  updateCategory(id: TCategoryId, name: string): void {
    this.#store.dispatch(CashActions.updateCategory(id, name));
  }

  // ── Rules ────────────────────────────────────────────────────────────────
  addRule(rule: ICashRule): void {
    this.#store.dispatch(CashActions.addRule(rule));
  }

  updateRule(rule: ICashRule): void {
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
