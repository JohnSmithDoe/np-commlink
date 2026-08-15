/* ─── why ─────────────────────────────────────────────────────────
 * A transaction carries at most one category but inherits the plural
 * `categoryIds`, deliberately: that is the field the filter bar,
 * `matcherForFilter`, the `?filter=` deep link and the row's category note
 * all read. A tuple would buy nothing and fight `UpdateDTO<T>`.
 *
 * So the "exactly one" invariant lives here rather than in the type — one
 * accessor for reads, `withCategory` for writes, so no caller hand-rolls
 * the array and no second element can appear.
 * ───────────────────────────────────────────────────────────────── */
import { CategoryId } from '../../@shared/model/category.types';
import { CashTransaction } from '../model/transaction.types';

export const categoryIdOf = (
  txn: Pick<CashTransaction, 'categoryIds'>
): CategoryId | undefined => txn.categoryIds?.[0];

export const withCategory = <T extends Pick<CashTransaction, 'categoryIds'>>(
  txn: T,
  categoryId: CategoryId | undefined
): T => ({ ...txn, categoryIds: categoryId ? [categoryId] : undefined });
