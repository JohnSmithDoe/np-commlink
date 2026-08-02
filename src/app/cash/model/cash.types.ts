import { CategoryList } from '../../@shared/model/category.types';
import { CashAccount } from './account.types';
import { CashRule } from './rule.types';
import { CashTransaction } from './transaction.types';

export const CASH_CATEGORIES_LIST_ID = '_cash-categories';

export interface CashState {
  accounts: CashAccount[];
  transactions: CashTransaction[];
  rules: CashRule[];
  categories: CategoryList;
}
