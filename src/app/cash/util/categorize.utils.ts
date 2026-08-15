import { CashFilterCondition, CashRule } from '../model/rule.types';
import { CashTransaction } from '../model/transaction.types';
import { categoryIdOf } from './cash-category.utils';
import { eurToCents } from './money.utils';

import { CategoryId } from '../../@shared/model/category.types';

const STORED_THRESHOLD_LANGUAGE = 'de' as const;

const matchesAmountCondition = (
  amountCents: number,
  condition: CashFilterCondition
): boolean => {
  const target = eurToCents(condition.value, STORED_THRESHOLD_LANGUAGE);
  if (target === null) return false; // unparseable threshold never matches
  switch (condition.op) {
    case 'eq': {
      return amountCents === target;
    }
    case 'lt': {
      return amountCents < target;
    }
    case 'lte': {
      return amountCents <= target;
    }
    case 'gt': {
      return amountCents > target;
    }
    case 'gte': {
      return amountCents >= target;
    }
    default: {
      return false;
    } // a string op on `amount` is invalid
  }
};

const matchesRegexSafely = (
  source: string,
  pattern: string,
  caseSensitive: boolean
): boolean => {
  const flags = caseSensitive ? '' : 'i';
  try {
    return new RegExp(pattern, flags).test(source);
  } catch {
    return false; // an invalid regex never matches (never throws)
  }
};

const matchesDescriptionCondition = (
  source: string,
  condition: CashFilterCondition
): boolean => {
  const caseSensitive = condition.caseSensitive ?? false;
  const haystack = caseSensitive ? source : source.toLowerCase();
  const needle = caseSensitive
    ? condition.value
    : condition.value.toLowerCase();
  switch (condition.op) {
    case 'contains': {
      return haystack.includes(needle);
    }
    case 'startsWith': {
      return haystack.startsWith(needle);
    }
    case 'endsWith': {
      return haystack.endsWith(needle);
    }
    case 'equals': {
      return haystack === needle;
    }
    case 'regex': {
      return matchesRegexSafely(source, condition.value, caseSensitive);
    }
    default: {
      return false;
    } // a numeric op on `description` is invalid
  }
};

export function matchesCondition(
  txn: CashTransaction,
  condition: CashFilterCondition
): boolean {
  return condition.field === 'amount'
    ? matchesAmountCondition(txn.amountCents, condition)
    : matchesDescriptionCondition(txn.name, condition);
}

export function matchesRule(txn: CashTransaction, rule: CashRule): boolean {
  if (rule.conditions.length === 0) return false; // an empty rule never fires
  return rule.match === 'all'
    ? rule.conditions.every((condition) => matchesCondition(txn, condition))
    : rule.conditions.some((condition) => matchesCondition(txn, condition));
}

export function categorize(
  txn: CashTransaction,
  rules: readonly CashRule[]
): CategoryId | undefined {
  const ordered = rules.toSorted((a, b) => a.order - b.order);
  for (const rule of ordered) {
    if (matchesRule(txn, rule)) return rule.categoryId;
  }
  return undefined;
}

export interface CashRecategorization {
  transactionId: string;
  categoryId: CategoryId | undefined;
}

export function recategorizations(
  transactions: readonly CashTransaction[],
  rules: readonly CashRule[]
): CashRecategorization[] {
  const changes: CashRecategorization[] = [];
  for (const txn of transactions) {
    if (txn.categoryManual) continue;
    const categoryId = categorize(txn, rules);
    if (categoryId !== categoryIdOf(txn)) {
      changes.push({ transactionId: txn.id, categoryId });
    }
  }
  return changes;
}
