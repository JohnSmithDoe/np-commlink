import dayjs from 'dayjs';
import { CashTransaction } from '../model/transaction.types';

export const SAME_SPEND_WINDOW_DAYS = 3;

export const calendarDaysApart = (a: string, b: string): number =>
  Math.abs(dayjs(a).startOf('day').diff(dayjs(b).startOf('day'), 'day'));

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

  const isCouldBeSameSpend = (txn: CashTransaction): boolean => {
    return (
      txn.source === 'imported' &&
      txn.id !== pending.id &&
      txn.accountId === pending.accountId &&
      txn.amountCents === pending.amountCents &&
      !claimedSurvivorIds.has(txn.id) &&
      calendarDaysApart(txn.dateISO, pending.dateISO) <= SAME_SPEND_WINDOW_DAYS
    );
  };

  return all
    .filter((txn) => isCouldBeSameSpend(txn))
    .toSorted((a, b) => millisApart(a) - millisApart(b)); // closest date first
}
