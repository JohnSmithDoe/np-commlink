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

const doesMatchAmountCondition = (
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

const doesMatchRegexSafely = (
  source: string,
  pattern: string,
  isCaseSensitive: boolean
): boolean => {
  const flags = isCaseSensitive ? '' : 'i';
  try {
    const regex = new RegExp(pattern, flags);
    return regex.test(source);
  } catch {
    return false; // an invalid regex never matches (never throws)
  }
};

const doesMatchDescriptionCondition = (
  source: string,
  condition: CashFilterCondition
): boolean => {
  const isCaseSensitive = condition.caseSensitive ?? false;
  const haystack = isCaseSensitive ? source : source.toLowerCase();
  const needle = isCaseSensitive
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
      return doesMatchRegexSafely(source, condition.value, isCaseSensitive);
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

export function doesMatchCondition(
  txn: CashTransaction,
  condition: CashFilterCondition
): boolean {
  if (!isTextFilterField(condition.field)) {
    return doesMatchAmountCondition(txn.amountCents, condition);
  }
  const source = textFieldValue(txn, condition.field); // an unwritten IBAN is not the empty one
  return (
    source !== undefined && doesMatchDescriptionCondition(source, condition)
  );
}

export function doesMatchRule(
  txn: CashTransaction,
  rule: ConditionSet
): boolean {
  if (rule.conditions.length === 0) return false; // an empty rule never fires
  return rule.match === 'all'
    ? rule.conditions.every((condition) => doesMatchCondition(txn, condition))
    : rule.conditions.some((condition) => doesMatchCondition(txn, condition));
}

export const rulesByOrder = (rules: readonly CashRule[]): CashRule[] =>
  rules.toSorted((a, b) => a.order - b.order);

export const categorizeOrdered = (
  txn: CashTransaction,
  ordered: readonly CashRule[]
): CategoryId | undefined => {
  for (const rule of ordered) {
    if (doesMatchRule(txn, rule)) return rule.categoryId;
  }
  return undefined;
};

export function categorize(
  txn: CashTransaction,
  rules: readonly CashRule[]
): CategoryId | undefined {
  return categorizeOrdered(txn, rulesByOrder(rules));
}

export interface RuleStat {
  matched: number;
  claimed: number;
}

export function ruleStats(
  transactions: readonly CashTransaction[],
  rules: readonly CashRule[]
): Record<string, RuleStat> {
  const ordered = rulesByOrder(rules);
  const stats: Record<string, RuleStat> = {};
  for (const rule of ordered) stats[rule.id] = { matched: 0, claimed: 0 };

  for (const txn of transactions) {
    let claimedBy: string | undefined;
    for (const rule of ordered) {
      if (!doesMatchRule(txn, rule)) continue;
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
  const ordered = rulesByOrder(rules);
  const changes: CashRecategorization[] = [];
  for (const txn of transactions) {
    if (txn.categoryManual) continue;
    const categoryId = categorizeOrdered(txn, ordered);
    if (categoryId !== categoryIdOf(txn)) {
      changes.push({ transactionId: txn.id, categoryId });
    }
  }
  return changes;
}
