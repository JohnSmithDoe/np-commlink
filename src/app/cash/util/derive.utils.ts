/* ─── why ─────────────────────────────────────────────────────────
 * A booking recognises itself by whichever field the bank filled in, so the
 * ladder is ordered by how STABLE each one is, not by how much it says. A
 * mandate id is one creditor and one contract — the definition of a fixed
 * cost. An IBAN survives a merchant rename. A name survives a new branch.
 * The description survives least of all, which is why it comes last.
 *
 * The description stem is ONE token, never two joined by a space: the
 * original may separate them by anything, and a `contains` built from a
 * guess about the gap matches nothing. One token cannot be wrong about the
 * source it came from — only too broad, and the dialog's match count is
 * what says so out loud.
 *
 * The period is read off the history rather than defaulted, because the
 * booking that prompts a schedule is rarely the first of its kind: three
 * quarterly premiums already in the ledger know their own period.
 * ───────────────────────────────────────────────────────────────── */
import dayjs from 'dayjs';
import {
  CashFilterCondition,
  CashRule,
  ConditionSet,
} from '../model/rule.types';
import { CashSchedule } from '../model/schedule.types';
import { CashTransaction } from '../model/transaction.types';
import { categoryIdOf } from './cash-category.utils';
import { matchesRule } from './categorize.utils';
import { createCashRule, createCashSchedule } from './cash.factory';

const STEM_MIN_LENGTH = 3;
const PERIODS = [1, 3, 6, 12] as const;

export const descriptionStem = (description: string): string => {
  const token = description
    .split(/[^\p{L}]+/u)
    .find((candidate) => candidate.length >= STEM_MIN_LENGTH);
  return token ?? description.trim();
};

export function conditionsFrom(
  txn: CashTransaction
): [CashFilterCondition, ...CashFilterCondition[]] {
  if (txn.mandateId) {
    return [{ field: 'mandateId', op: 'equals', value: txn.mandateId }];
  }
  if (txn.counterpartyIban) {
    return [
      { field: 'counterpartyIban', op: 'equals', value: txn.counterpartyIban },
    ];
  }
  if (txn.counterpartyName) {
    return [
      {
        field: 'counterpartyName',
        op: 'contains',
        value: txn.counterpartyName.trim(),
        caseSensitive: false,
      },
    ];
  }
  return [
    {
      field: 'description',
      op: 'contains',
      value: descriptionStem(txn.name),
      caseSensitive: false,
    },
  ];
}

const nameFrom = (txn: CashTransaction): string =>
  txn.counterpartyName?.trim() || descriptionStem(txn.name);

export function ruleFrom(txn: CashTransaction, order: number): CashRule {
  return {
    ...createCashRule(nameFrom(txn), categoryIdOf(txn) ?? '', order),
    conditions: conditionsFrom(txn),
  };
}

const monthsBetween = (earlier: string, later: string): number =>
  dayjs(later).startOf('month').diff(dayjs(earlier).startOf('month'), 'month');

const median = (values: readonly number[]): number => {
  const sorted = values.toSorted((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? Math.round(((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2)
    : (sorted[middle] ?? 1);
};

const snapToPeriod = (months: number): number => {
  let best: number = PERIODS[0];
  for (const period of PERIODS) {
    if (Math.abs(period - months) < Math.abs(best - months)) best = period;
  }
  return best;
};

export function periodMonthsFrom(datesISO: readonly string[]): number {
  const ordered = datesISO.toSorted((a, b) => a.localeCompare(b));
  const gaps: number[] = [];
  for (let index = 1; index < ordered.length; index++) {
    const gap = monthsBetween(ordered[index - 1] ?? '', ordered[index] ?? '');
    if (gap > 0) gaps.push(gap);
  }
  return gaps.length === 0 ? 1 : snapToPeriod(median(gaps));
}

export function scheduleFrom(
  txn: CashTransaction,
  history: readonly CashTransaction[]
): CashSchedule {
  const conditions = conditionsFrom(txn);
  const matched = history.filter((candidate) =>
    matchesRule(candidate, { match: 'all', conditions })
  );
  const dates = [...matched.map(({ dateISO }) => dateISO), txn.dateISO];
  const periodMonths = periodMonthsFrom(dates);
  const latest = dates.toSorted((a, b) => b.localeCompare(a))[0] ?? txn.dateISO;

  return {
    ...createCashSchedule(nameFrom(txn)),
    conditions,
    categoryId: categoryIdOf(txn),
    amountCents: txn.amountCents,
    periodMonths,
    nextDueISO: dayjs(latest).add(periodMonths, 'month').format(),
  };
}

interface MatchSummary {
  matched: number;
  total: number;
  conflicting: number;
  sample: readonly CashTransaction[];
}

const SAMPLE_SHOWN = 5;

export function matchSummary(
  conditionSet: ConditionSet,
  transactions: readonly CashTransaction[],
  targetCategoryId: string
): MatchSummary {
  const matched = transactions.filter((txn) => matchesRule(txn, conditionSet));
  const conflicting = matched.filter((txn) => {
    const current = categoryIdOf(txn);
    return !!current && current !== targetCategoryId;
  });
  return {
    matched: matched.length,
    total: transactions.length,
    conflicting: conflicting.length,
    sample: matched
      .toSorted((a, b) => b.dateISO.localeCompare(a.dateISO))
      .slice(0, SAMPLE_SHOWN),
  };
}
