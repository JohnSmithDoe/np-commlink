import { CategoryList } from '../../@shared/model/category.types';
import { ItemList } from '../../@shared/model/item-list.types';
import { CashAccount } from './account.types';
import { CashRule } from './rule.types';
import { CashSchedule } from './schedule.types';
import { CashTransaction } from './transaction.types';

export const CASH_CATEGORIES_LIST_ID = '_cash-categories';
export const CASH_ACCOUNTS_LIST_ID = '_cash-accounts';
export const CASH_TRANSACTIONS_LIST_ID = '_cash-transactions';
export const CASH_RULES_LIST_ID = '_cash-rules';
export const CASH_SCHEDULES_LIST_ID = '_cash-schedules';

export type CashAccountsState = Readonly<
  ItemList<CashAccount> & { id: typeof CASH_ACCOUNTS_LIST_ID }
>;

export type CashTransactionsState = Readonly<
  ItemList<CashTransaction> & { id: typeof CASH_TRANSACTIONS_LIST_ID }
>;

export type CashRulesState = Readonly<
  ItemList<CashRule> & { id: typeof CASH_RULES_LIST_ID }
>;

export type CashSchedulesState = Readonly<
  ItemList<CashSchedule> & { id: typeof CASH_SCHEDULES_LIST_ID }
>;

export interface CashState {
  accounts: CashAccountsState;
  transactions: CashTransactionsState;
  rules: CashRulesState;
  schedules: CashSchedulesState;
  categories: CategoryList;
}
