import {
  CashFilterCondition,
  CashRule,
  ConditionSet,
  isTextFilterField,
  TextFilterField,
} from '../model/rule.types';
import { CamtDetails, CashTransaction } from '../model/transaction.types';
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

const textFieldValue = (
  txn: CashTransaction,
  field: TextFilterField
): string | undefined =>
  field === 'description' ? txn.name : (txn as CamtDetails)[field];

export function matchesCondition(
  txn: CashTransaction,
  condition: CashFilterCondition
): boolean {
  if (!isTextFilterField(condition.field)) {
    return matchesAmountCondition(txn.amountCents, condition);
  }
  const source = textFieldValue(txn, condition.field);
  return source === undefined
    ? false // an unwritten IBAN is not the empty one
    : matchesDescriptionCondition(source, condition);
}

export function matchesRule(txn: CashTransaction, rule: ConditionSet): boolean {
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

export interface RuleStat {
  matched: number;
  claimed: number;
}

export function ruleStats(
  transactions: readonly CashTransaction[],
  rules: readonly CashRule[]
): Record<string, RuleStat> {
  const ordered = rules.toSorted((a, b) => a.order - b.order);
  const stats: Record<string, RuleStat> = {};
  for (const rule of ordered) stats[rule.id] = { matched: 0, claimed: 0 };

  for (const txn of transactions) {
    let claimedBy: string | undefined;
    for (const rule of ordered) {
      if (!matchesRule(txn, rule)) continue;
      const stat = stats[rule.id];
      if (stat) stat.matched++;
      claimedBy ??= rule.id;
    }
    const winner = claimedBy ? stats[claimedBy] : undefined;
    if (winner) winner.claimed++;
  }
  return stats;
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
