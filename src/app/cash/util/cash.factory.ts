import dayjs from 'dayjs';
import { createBaseItem } from '../../@shared/util/app.factory';
import { CategoryId } from '../../@shared/model/category.types';
import { CashAccount } from '../model/account.types';
import { CashRule } from '../model/rule.types';
import { CashTransaction } from '../model/transaction.types';

export const createCashAccount = (name: string): CashAccount => ({
  ...createBaseItem(name),
  kind: 'cash',
  openingBalanceCents: 0,
  openingDateISO: dayjs().format(),
});

export const createCashTransaction = (
  name: string,
  accountId: string,
  categoryId?: CategoryId
): CashTransaction => ({
  ...createBaseItem(name, categoryId),
  accountId,
  dateISO: dayjs().format(),
  amountCents: 0,
  source: 'manual',
  status: 'confirmed',
});

export const createCashRule = (
  name: string,
  categoryId: CategoryId = '',
  order = 0
): CashRule => ({
  ...createBaseItem(name),
  categoryIds: undefined,
  order,
  match: 'all',
  conditions: [{ field: 'description', op: 'contains', value: '' }],
  categoryId,
});
