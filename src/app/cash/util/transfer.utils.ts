import { ICashTransaction } from '../model/transaction.types';

/**
 * The two legs of a transfer between own accounts (see docs/cash.md §7.3 →
 * Transfers). Built as a pair so they can never desync: equal magnitude, one
 * outflow (`< 0`) from the source, one inflow (`> 0`) to the target, both
 * `isTransfer` and sharing a `transferGroupId`. Pure — `makeId` injected. The
 * caller dispatches `Book Transfer` with the pair; the reducer appends both.
 */
export function buildTransferLegs(
  fromAccountId: string,
  toAccountId: string,
  amountCents: number,
  dateISO: string,
  description: string,
  makeId: () => string
): [ICashTransaction, ICashTransaction] {
  const transferGroupId = makeId();
  const magnitude = Math.abs(amountCents);
  const shared = {
    dateISO,
    description,
    source: 'manual' as const,
    status: 'confirmed' as const,
    isTransfer: true,
    transferGroupId,
  };
  return [
    {
      ...shared,
      id: makeId(),
      accountId: fromAccountId,
      amountCents: -magnitude,
    },
    { ...shared, id: makeId(), accountId: toAccountId, amountCents: magnitude },
  ];
}
