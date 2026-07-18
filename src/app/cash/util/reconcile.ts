import dayjs from 'dayjs';
import { ICashTransaction } from '../model';

/**
 * Reconciliation candidate matching (see docs/cash-plan.md → Reconciliation).
 * For a `pending` manual transaction, the imported transactions it could be the
 * same real spend as: same account, EQUAL signed cents, `dateISO` within ±3
 * days, and not already the survivor of another match. We only ever *propose* —
 * the user confirms, because an equal-amount coincidence (two identical fares)
 * would otherwise corrupt the ledger.
 */
const WINDOW_MS = 3 * 24 * 60 * 60 * 1000;

export function findReconciliationCandidates(
  pending: ICashTransaction,
  all: readonly ICashTransaction[]
): ICashTransaction[] {
  if (pending.status !== 'pending' || pending.matchedTxnId) return [];

  const survivors = new Set(
    all.map((t) => t.matchedTxnId).filter((id): id is string => !!id)
  );
  const pendingDate = dayjs(pending.dateISO);
  const daysApart = (t: ICashTransaction) =>
    Math.abs(dayjs(t.dateISO).diff(pendingDate));

  return all
    .filter(
      (t) =>
        t.source === 'imported' &&
        t.id !== pending.id &&
        t.accountId === pending.accountId &&
        t.amountCents === pending.amountCents &&
        !survivors.has(t.id) &&
        daysApart(t) <= WINDOW_MS
    )
    .sort((a, b) => daysApart(a) - daysApart(b)); // closest date first
}
