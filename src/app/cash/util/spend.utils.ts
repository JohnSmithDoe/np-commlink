/* ─── why ─────────────────────────────────────────────────────────
 * A card spend is booked `pending` and a cash spend `confirmed`, and that is
 * the whole difference between the two methods. Cash leaves no other trace:
 * nothing will ever report it, so the row typed here is the only record and
 * it is final. A card payment is the opposite — the bank sends the same spend
 * again in the next statement, and a `confirmed` row would be counted twice.
 *
 * `pending` is precisely what `findReconciliationCandidates` looks for, so
 * the import offers the match and `reconcile` collapses the pair: the manual
 * row keeps `matchedTxnId` and drops out of every balance, the bank's row
 * survives. It still counts against today the moment it is typed, because
 * `spentTodayCents` reads the amount and not the status.
 *
 * `categoryManual` is stamped whenever a category was picked, which is also
 * what carries the filing across that reconcile onto the surviving bank row.
 *
 * Savings accounts appear under neither method — nobody pays a baker from
 * one, and offering it invites the typo that books a spend out of reserves.
 * ───────────────────────────────────────────────────────────────── */
import { CategoryId } from '../../@shared/model/category.types';
import {
  ACCOUNT_KINDS_BY_METHOD,
  CashAccount,
  PaymentMethod,
} from '../model/account.types';
import { CashTransaction } from '../model/transaction.types';
import { createCashTransaction } from './cash.factory';

export const accountsForMethod = (
  accounts: readonly CashAccount[],
  method: PaymentMethod
): CashAccount[] =>
  accounts.filter(({ kind }) => ACCOUNT_KINDS_BY_METHOD[method].includes(kind));

export const createCashSpend = (
  name: string,
  accountId: string,
  amountCents: number,
  method: PaymentMethod,
  categoryId?: CategoryId
): CashTransaction => ({
  ...createCashTransaction(name, accountId, categoryId),
  amountCents: -Math.abs(amountCents),
  status: method === 'card' ? 'pending' : 'confirmed',
  categoryManual: categoryId ? true : undefined,
});
