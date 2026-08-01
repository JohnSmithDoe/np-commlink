import { ICategoryList } from '../../@shared/model/category.types';

// The `ItemDialogService` handshake token for the cash catalog.
export const CASH_CATEGORIES_LIST_ID = '_cash-categories';
import { ICashAccount } from './account.types';
import { ICashRule } from './rule.types';
import { ICashTransaction } from './transaction.types';

// The `cash` slice: accounts and their signed-cent transactions, the ordered
// filter rules that categorize them, and the one category catalog both reference
// by id. A manual category override wins and is shielded from rule re-runs.
export interface ICashState {
  accounts: ICashAccount[];
  transactions: ICashTransaction[];
  rules: ICashRule[];
  // The catalog, as a list of its own: txns and rules reference its entries by
  // id, and the shared list page + edit dialog drive it like any other list.
  categories: ICategoryList;
}
