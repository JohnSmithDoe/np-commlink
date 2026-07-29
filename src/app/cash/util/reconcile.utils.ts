import dayjs from 'dayjs';
import { ICashTransaction } from '../model/transaction.types';

/**
 * Reconciliation candidate matching (see docs/project-summary.md §7.3 → Reconciliation).
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

  const claimedSurvivorIds = new Set(
    all.map((txn) => txn.matchedTxnId).filter((id): id is string => !!id)
  );
  const pendingDate = dayjs(pending.dateISO);
  // dayjs.diff() with no unit yields milliseconds — hence the name and WINDOW_MS.
  const millisApart = (txn: ICashTransaction) =>
    Math.abs(dayjs(txn.dateISO).diff(pendingDate));

  const couldBeSameSpend = (txn: ICashTransaction): boolean =>
    txn.source === 'imported' &&
    txn.id !== pending.id &&
    txn.accountId === pending.accountId &&
    txn.amountCents === pending.amountCents &&
    !claimedSurvivorIds.has(txn.id) &&
    millisApart(txn) <= WINDOW_MS;

  return all
    .filter((txn) => couldBeSameSpend(txn))
    .toSorted((a, b) => millisApart(a) - millisApart(b)); // closest date first
}
