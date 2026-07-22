import {
  ICashAccount,
  ICashRule,
  ICashState,
  ICashTransaction,
} from '../model';
import { TEST_TIMESTAMP } from '../../@shared/testing/test-data';

// Deterministic cash fixtures. Owned by the cash context (DDD review #1): they
// live here, not in the shared @shared/testing kit, because that kit is
// domain:shared and may not reference domain:cash types (Sheriff-enforced).
export function mockCashAccount(
  overrides: Partial<ICashAccount> = {}
): ICashAccount {
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
  overrides: Partial<ICashTransaction> = {}
): ICashTransaction {
  return {
    id: 'cash-txn-1',
    accountId: 'cash-account-1',
    dateISO: TEST_TIMESTAMP,
    amountCents: -1999,
    description: 'REWE SAGT DANKE',
    source: 'manual',
    status: 'confirmed',
    ...overrides,
  };
}

export function mockCashRule(overrides: Partial<ICashRule> = {}): ICashRule {
  return {
    id: 'cash-rule-1',
    order: 0,
    match: 'any',
    conditions: [{ field: 'description', op: 'contains', value: 'REWE' }],
    categoryId: 'cash-cat-groceries',
    ...overrides,
  };
}

export function mockCashState(overrides: Partial<ICashState> = {}): ICashState {
  return {
    accounts: [],
    transactions: [],
    rules: [],
    categories: [],
    ...overrides,
  };
}
