import dayjs from 'dayjs';
import { CashTransaction } from '../model/transaction.types';

const WINDOW_MS = 3 * 24 * 60 * 60 * 1000;

export function findReconciliationCandidates(
  pending: CashTransaction,
  all: readonly CashTransaction[]
): CashTransaction[] {
  if (pending.status !== 'pending' || pending.matchedTxnId) return [];

  const claimedSurvivorIds = new Set(
    all.map((txn) => txn.matchedTxnId).filter((id): id is string => !!id)
  );
  const pendingDate = dayjs(pending.dateISO);
  const millisApart = (txn: CashTransaction) =>
    Math.abs(dayjs(txn.dateISO).diff(pendingDate));

  const couldBeSameSpend = (txn: CashTransaction): boolean =>
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
