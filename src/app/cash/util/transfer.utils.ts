import { CashTransaction } from '../model/transaction.types';

export function buildTransferLegs(
  fromAccountId: string,
  toAccountId: string,
  amountCents: number,
  dateISO: string,
  description: string,
  makeId: () => string
): [CashTransaction, CashTransaction] {
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
