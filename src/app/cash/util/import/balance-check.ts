/* ─── why ─────────────────────────────────────────────────────────
 * The statement's `CLBD` is the bank's own closing figure, so comparing it
 * against the balance we derive turns a silent import gap into a number.
 *
 * It is compared AS OF the statement's last entry, not against the whole
 * ledger: a manual row typed today, or a later statement already imported,
 * is money the bank had not booked when it wrote this figure, and counting
 * it would report a mismatch on a ledger that is correct.
 *
 * `matchedTxnId` rows are skipped for the same reason `selectAccountBalances`
 * skips them — a reconciled pair moved the money once.
 *
 * A PENDING row is skipped because `CLBD` is the closing BOOKED balance: a
 * card spend the bank has not settled is money it did not count, and the one
 * import where the ledger is right is the one that would report a gap.
 * ───────────────────────────────────────────────────────────────── */
import { CashTransaction } from '../../model/transaction.types';

const onOrBefore = (dateISO: string, cutoffISO: string): boolean =>
  dateISO.slice(0, 10) <= cutoffISO.slice(0, 10);

export function balanceDifferenceCents(
  closingBalanceCents: number,
  asOfISO: string,
  accountId: string,
  openingBalanceCents: number,
  ledger: readonly CashTransaction[]
): number {
  let derived = openingBalanceCents;
  for (const txn of ledger) {
    if (txn.accountId !== accountId) continue;
    if (txn.matchedTxnId) continue;
    if (txn.status === 'pending') continue;
    if (!onOrBefore(txn.dateISO, asOfISO)) continue;
    derived += txn.amountCents;
  }
  return closingBalanceCents - derived;
}

export function lastEntryDateISO(
  rows: readonly { dateISO: string }[]
): string | undefined {
  let latest: string | undefined;
  for (const row of rows) {
    if (latest === undefined || row.dateISO > latest) latest = row.dateISO;
  }
  return latest;
}
