import { ICashFilterCondition, ICashRule } from '../model/rule.types';
import { ICashTransaction } from '../model/transaction.types';
import { eurToCents } from './money.utils';

import { TCategoryId } from '../../@shared/model/category.types';

/**
 * The cash categorization engine — pure, so it is trivially testable and shared
 * by P3 ("Apply rules") and P4 (auto-run on an import batch). See
 * docs/cash.md §7.3 → Categorization engine. Rules never touch a transaction the
 * user has flagged `categoryManual` — that shielding is the CALLER's job (this
 * module only decides which category a rule set would assign).
 */

/**
 * A stored threshold is always read as German, whatever the UI language is.
 *
 * `ICashFilterCondition.value` is a persisted *string*, and the two conventions
 * are mutually ambiguous — `"1.234"` is 1234 € in German and 1.23 € in English —
 * so reading it in the current language would silently re-interpret every
 * existing rule the first time someone switched. German is therefore the
 * canonical storage form, and the rule editor normalizes onto it (see
 * `toCondition` in `rule-edit-modal`).
 */
const STORED_THRESHOLD_LANGUAGE = 'de' as const;

const matchesAmountCondition = (
  amountCents: number,
  condition: ICashFilterCondition
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
  condition: ICashFilterCondition
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
  txn: ICashTransaction,
  condition: ICashFilterCondition
): boolean {
  return condition.field === 'amount'
    ? matchesAmountCondition(txn.amountCents, condition)
    : matchesDescriptionCondition(txn.description, condition);
}

/** Does a rule fire? `all` = every condition (AND), `any` = at least one (OR). */
export function matchesRule(txn: ICashTransaction, rule: ICashRule): boolean {
  if (rule.conditions.length === 0) return false; // an empty rule never fires
  return rule.match === 'all'
    ? rule.conditions.every((condition) => matchesCondition(txn, condition))
    : rule.conditions.some((condition) => matchesCondition(txn, condition));
}

/**
 * The category id the first matching rule (by ascending `order`) would assign,
 * or `undefined` if none match. Does not mutate `rules`.
 */
export function categorize(
  txn: ICashTransaction,
  rules: readonly ICashRule[]
): TCategoryId | undefined {
  const ordered = rules.toSorted((a, b) => a.order - b.order);
  for (const rule of ordered) {
    if (matchesRule(txn, rule)) return rule.categoryId;
  }
  return undefined;
}

export interface ICashRecategorization {
  transactionId: string;
  categoryId: TCategoryId | undefined;
}

/**
 * Which transactions the current rule set would re-file, and to what. The
 * `categoryManual` shielding lives here rather than in the calling page, so the
 * rule that "rules never touch a manual override" sits next to the engine it
 * constrains — and is covered by this module's spec.
 */
export function recategorizations(
  transactions: readonly ICashTransaction[],
  rules: readonly ICashRule[]
): ICashRecategorization[] {
  const changes: ICashRecategorization[] = [];
  for (const txn of transactions) {
    if (txn.categoryManual) continue;
    const categoryId = categorize(txn, rules);
    if (categoryId !== txn.categoryId) {
      changes.push({ transactionId: txn.id, categoryId });
    }
  }
  return changes;
}
