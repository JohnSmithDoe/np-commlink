import dayjs from 'dayjs';
import { CashTransaction } from '../model/transaction.types';

const WINDOW_DAYS = 3;

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
  const daysApart = (txn: CashTransaction) => {
    return Math.abs(
      dayjs(txn.dateISO).startOf('day').diff(pendingDate.startOf('day'), 'day')
    );
  };

  const isCouldBeSameSpend = (txn: CashTransaction): boolean => {
    return (
      txn.source === 'imported' &&
      txn.id !== pending.id &&
      txn.accountId === pending.accountId &&
      txn.amountCents === pending.amountCents &&
      !claimedSurvivorIds.has(txn.id) &&
      daysApart(txn) <= WINDOW_DAYS
    );
  };

  return all
    .filter((txn) => isCouldBeSameSpend(txn))
    .toSorted((a, b) => millisApart(a) - millisApart(b)); // closest date first
}
