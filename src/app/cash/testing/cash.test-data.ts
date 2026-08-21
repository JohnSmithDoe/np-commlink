import { CategoryList } from '../../@shared/model/category.types';
import { CashAccount } from '../model/account.types';
import {
  CASH_ACCOUNTS_LIST_ID,
  CASH_CATEGORIES_LIST_ID,
  CASH_RULES_LIST_ID,
  CASH_SCHEDULES_LIST_ID,
  CASH_TRANSACTIONS_LIST_ID,
  CashState,
} from '../model/cash.types';
import { CashRule } from '../model/rule.types';
import { CashSchedule } from '../model/schedule.types';
import { CashTransaction } from '../model/transaction.types';
import { TEST_TIMESTAMP } from '../../@shared/testing/test-data';

export function mockCashAccount(
  overrides: Partial<CashAccount> = {}
): CashAccount {
  return {
    id: 'cash-account-1',
    name: 'Giro',
    kind: 'giro',
    openingBalanceCents: 0,
    openingDateISO: TEST_TIMESTAMP,
    createdAt: TEST_TIMESTAMP,
    ...overrides,
  };
}

export function mockCashTransaction(
  overrides: Partial<CashTransaction> = {}
): CashTransaction {
  return {
    id: 'cash-txn-1',
    accountId: 'cash-account-1',
    dateISO: TEST_TIMESTAMP,
    amountCents: -1999,
    name: 'NORDKAUF SAGT DANKE',
    source: 'manual',
    status: 'confirmed',
    ...overrides,
  };
}

export function mockCashRule(overrides: Partial<CashRule> = {}): CashRule {
  return {
    id: 'cash-rule-1',
    name: 'NORDKAUF',
    order: 0,
    match: 'any',
    conditions: [{ field: 'description', op: 'contains', value: 'NORDKAUF' }],
    categoryId: 'cash-cat-stuff',
    ...overrides,
  };
}

export function mockCashCategoryList(
  overrides: Partial<CategoryList> = {}
): CategoryList {
  return { id: CASH_CATEGORIES_LIST_ID, items: [], ...overrides };
}

type CashStateItems = {
  accounts?: CashAccount[];
  transactions?: CashTransaction[];
  rules?: CashRule[];
  schedules?: CashSchedule[];
  categories?: CategoryList;
};

export function mockCashState(overrides: CashStateItems = {}): CashState {
  return {
    accounts: { id: CASH_ACCOUNTS_LIST_ID, items: overrides.accounts ?? [] },
    transactions: {
      id: CASH_TRANSACTIONS_LIST_ID,
      items: overrides.transactions ?? [],
      sort: { sortBy: 'dateISO', sortDirection: 'desc' },
    },
    rules: {
      id: CASH_RULES_LIST_ID,
      items: overrides.rules ?? [],
      sort: { sortBy: 'order', sortDirection: 'asc' },
    },
    schedules: {
      id: CASH_SCHEDULES_LIST_ID,
      items: overrides.schedules ?? [],
      sort: { sortBy: 'nextDueISO', sortDirection: 'asc' },
    },
    categories: overrides.categories ?? mockCashCategoryList(),
  };
}

export function mockCashSchedule(
  overrides: Partial<CashSchedule> = {}
): CashSchedule {
  return {
    id: 'cash-schedule-1',
    name: 'Miete',
    match: 'all',
    conditions: [{ field: 'description', op: 'contains', value: 'MIETE' }],
    amountCents: -90_000,
    periodMonths: 1,
    nextDueISO: '2026-02-01T00:00:00+01:00',
    createdAt: TEST_TIMESTAMP,
    ...overrides,
  };
}
