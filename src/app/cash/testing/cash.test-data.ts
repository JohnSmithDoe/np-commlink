import { CategoryList } from '../../@shared/model/category.types';
import { CashAccount } from '../model/account.types';
import {
  CASH_ACCOUNTS_LIST_ID,
  CASH_CATEGORIES_LIST_ID,
  CASH_RULES_LIST_ID,
  CASH_TRANSACTIONS_LIST_ID,
  CashState,
} from '../model/cash.types';
import { CashRule } from '../model/rule.types';
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
    name: 'REWE SAGT DANKE',
    source: 'manual',
    status: 'confirmed',
    ...overrides,
  };
}

export function mockCashRule(overrides: Partial<CashRule> = {}): CashRule {
  return {
    id: 'cash-rule-1',
    name: 'REWE',
    order: 0,
    match: 'any',
    conditions: [{ field: 'description', op: 'contains', value: 'REWE' }],
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
    categories: overrides.categories ?? mockCashCategoryList(),
  };
}
