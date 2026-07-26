import { ICategory } from '../../@shared/model/category.types';
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
  // First-class {id,name} catalog; txns/rules reference entries by id.
  categories: ICategory[];
}
