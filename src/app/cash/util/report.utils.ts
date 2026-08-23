/* ─── why ─────────────────────────────────────────────────────────
 * One pass, not six. The figures were six selectors that each walked every
 * booking and each re-decided what counts, so the window had to be added in
 * six places to be added at all — and a seventh figure would have re-derived
 * that predicate a seventh time. The unfiled rows the uncategorized page
 * lists ARE that seventh: they come off the same loop, because a second
 * function taking a scope would have walked the ledger again to find the
 * spending this one already stepped over.
 *
 * A window is a CALENDAR span, not a rolling day count: "this month" is the
 * month you are in, so the number stops moving under you every midnight and
 * matches the statement you would compare it against.
 *
 * A transfer leg and a reconciled duplicate are both excluded, for the same
 * reason: neither is money that left the household. Counting the transfer
 * would report the move between your own accounts as spending, which is the
 * single fastest way to make every figure here untrustworthy.
 * ───────────────────────────────────────────────────────────────── */
import dayjs from 'dayjs';
import { Category } from '../../@shared/model/category.types';
import { categoryNameLookup } from '../../@shared/util/categories/category.utils';
import {
  CashReport,
  CounterpartySpend,
  MonthTotals,
  ReportScope,
} from '../model/report.types';
import { CashTransaction } from '../model/transaction.types';
import { categoryIdOf, isHouseholdMoney } from './cash-category.utils';

const BIGGEST_EXPENSES_SHOWN = 10;
const QUARTER_MONTHS = 2;

export function windowStartISO(
  scope: ReportScope,
  todayISO: string
): string | undefined {
  const today = dayjs(todayISO);
  switch (scope) {
    case 'month': {
      return today.startOf('month').format();
    }
    case 'quarter': {
      return today.startOf('month').subtract(QUARTER_MONTHS, 'month').format();
    }
    case 'year': {
      return today.startOf('year').format();
    }
    case 'all': {
      return undefined;
    }
  }
}

const onOrAfter = (dateISO: string, cutoffISO: string): boolean =>
  dateISO.slice(0, 10) >= cutoffISO.slice(0, 10);

export function inScope(
  transactions: readonly CashTransaction[],
  scope: ReportScope,
  todayISO: string
): CashTransaction[] {
  const start = windowStartISO(scope, todayISO);
  return transactions.filter(
    (txn) => isHouseholdMoney(txn) && (!start || onOrAfter(txn.dateISO, start))
  );
}

export function reportFor(
  transactions: readonly CashTransaction[],
  categories: readonly Category[],
  scope: ReportScope,
  todayISO: string
): CashReport {
  const rows = inScope(transactions, scope, todayISO);
  const categoryName = categoryNameLookup(categories);

  const totals = { incomeCents: 0, spendCents: 0 };
  const byMonth = new Map<string, MonthTotals>();
  const byCategory = new Map<string, number>();
  const byIban = new Map<string, CounterpartySpend>();
  const unfiled: CashTransaction[] = [];
  let uncategorizedCents = 0;

  for (const txn of rows) {
    const month = txn.dateISO.slice(0, 7);
    const bucket = byMonth.get(month) ?? {
      month,
      incomeCents: 0,
      spendCents: 0,
    };
    if (txn.amountCents > 0) {
      totals.incomeCents += txn.amountCents;
      bucket.incomeCents += txn.amountCents;
    } else {
      const magnitude = -txn.amountCents;
      totals.spendCents += magnitude;
      bucket.spendCents += magnitude;

      const key = categoryIdOf(txn) ?? '';
      byCategory.set(key, (byCategory.get(key) ?? 0) + magnitude);
      if (!key) {
        uncategorizedCents += magnitude;
        unfiled.push(txn);
      }

      const iban = txn.counterpartyIban;
      if (iban) {
        const party = byIban.get(iban) ?? {
          iban,
          name: txn.counterpartyName ?? iban,
          cents: 0,
        };
        party.cents += magnitude;
        byIban.set(iban, party);
      }
    }
    byMonth.set(month, bucket);
  }

  return {
    totals: {
      ...totals,
      netCents: totals.incomeCents - totals.spendCents,
    },
    monthly: [...byMonth.values()].toSorted((a, b) =>
      a.month.localeCompare(b.month)
    ),
    byCategory: [...byCategory.entries()]
      .map(([id, cents]) => ({
        categoryId: id,
        category: categoryName(id),
        cents,
      }))
      .toSorted((a, b) => b.cents - a.cents),
    biggest: rows
      .filter((txn) => txn.amountCents < 0)
      .toSorted((a, b) => a.amountCents - b.amountCents)
      .slice(0, BIGGEST_EXPENSES_SHOWN)
      .map((txn) => ({
        id: txn.id,
        name: txn.name,
        dateISO: txn.dateISO,
        cents: -txn.amountCents,
        category: categoryName(categoryIdOf(txn) ?? ''),
      })),
    byCounterparty: [...byIban.values()].toSorted((a, b) => b.cents - a.cents),
    unfiled: unfiled.toSorted((a, b) => a.amountCents - b.amountCents),
    uncategorized: {
      totalCents: totals.spendCents,
      uncategorizedCents,
      percent:
        totals.spendCents === 0
          ? 0
          : Math.round((uncategorizedCents / totals.spendCents) * 100),
    },
  };
}
