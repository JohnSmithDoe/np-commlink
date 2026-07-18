import { ICashFilterCondition, ICashRule, ICashTransaction } from '../model';
import { eurToCents } from './money';

/**
 * The cash categorization engine — pure, so it is trivially testable and shared
 * by P3 ("Apply rules") and P4 (auto-run on an import batch). See
 * docs/cash-plan.md → Categorization engine. Rules never touch a transaction the
 * user has flagged `categoryManual` — that shielding is the CALLER's job (this
 * module only decides which category a rule set would assign).
 */

/** The text a description condition matches against: raw bank text if present. */
const descriptionText = (txn: ICashTransaction): string =>
  txn.rawDescription ?? txn.description;

/** Does a single condition hold for this transaction? */
export function matchesCondition(
  txn: ICashTransaction,
  condition: ICashFilterCondition
): boolean {
  if (condition.field === 'amount') {
    const target = eurToCents(condition.value);
    if (target === null) return false; // unparseable threshold never matches
    switch (condition.op) {
      case 'eq':
        return txn.amountCents === target;
      case 'lt':
        return txn.amountCents < target;
      case 'lte':
        return txn.amountCents <= target;
      case 'gt':
        return txn.amountCents > target;
      case 'gte':
        return txn.amountCents >= target;
      default:
        return false; // a string op on `amount` is invalid
    }
  }

  const caseSensitive = condition.caseSensitive ?? false;
  const source = descriptionText(txn);
  const haystack = caseSensitive ? source : source.toLowerCase();
  const needle = caseSensitive
    ? condition.value
    : condition.value.toLowerCase();
  switch (condition.op) {
    case 'contains':
      return haystack.includes(needle);
    case 'startsWith':
      return haystack.startsWith(needle);
    case 'endsWith':
      return haystack.endsWith(needle);
    case 'equals':
      return haystack === needle;
    case 'regex':
      try {
        return new RegExp(condition.value, caseSensitive ? '' : 'i').test(
          source
        );
      } catch {
        return false; // an invalid regex never matches (never throws)
      }
    default:
      return false; // a numeric op on `description` is invalid
  }
}

/** Does a rule fire? `all` = every condition (AND), `any` = at least one (OR). */
export function ruleMatches(txn: ICashTransaction, rule: ICashRule): boolean {
  if (rule.conditions.length === 0) return false; // an empty rule never fires
  return rule.match === 'all'
    ? rule.conditions.every((c) => matchesCondition(txn, c))
    : rule.conditions.some((c) => matchesCondition(txn, c));
}

/**
 * The category the first matching rule (by ascending `order`) would assign, or
 * `undefined` if none match. Does not mutate `rules`.
 */
export function categorize(
  txn: ICashTransaction,
  rules: readonly ICashRule[]
): string | undefined {
  const ordered = [...rules].sort((a, b) => a.order - b.order);
  for (const rule of ordered) {
    if (ruleMatches(txn, rule)) return rule.category;
  }
  return undefined;
}
