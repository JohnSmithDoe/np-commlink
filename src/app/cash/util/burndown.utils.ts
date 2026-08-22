/* ─── why ─────────────────────────────────────────────────────────
 * The allowance answers "what can I spend today", so it spends from what is
 * LEFT after the money that is already promised: the reserve accruing toward
 * future dues, and whatever is still to leave this month. A balance divided
 * by days remaining is optimistic every month except the one the premium
 * lands in, which is the month you would have acted on it.
 *
 * `daysRemaining` counts today, so the last day of the month divides by one
 * rather than zero.
 *
 * Today's allowance adds back what today already cost BEFORE dividing. The
 * balance has already dropped by it, so dividing straight away spreads
 * today's spend over every remaining day: the target would fall by a
 * fraction of each coffee instead of by the coffee, and never be reachable.
 *
 * Nothing here reads a clock. `todayISO` is passed in, which is what lets a
 * spec assert the 1st and the 28th without owning time.
 * ───────────────────────────────────────────────────────────────── */
import dayjs from 'dayjs';
import { CashSchedule } from '../model/schedule.types';
import { CashTransaction } from '../model/transaction.types';
import { dueThisMonthCents, reserveTotalCents } from './schedule.utils';

interface Burndown {
  balanceCents: number;
  reserveCents: number;
  stillDueCents: number;
  spentThisMonthCents: number;
  spentTodayCents: number;
  spendableCents: number;
  daysRemaining: number;
  perDayCents: number;
  allowanceTodayCents: number;
  remainingTodayCents: number;
}

const DAY = 'YYYY-MM-DD';
const MONTH = 'YYYY-MM';

export const daysRemainingInMonth = (todayISO: string): number => {
  const today = dayjs(todayISO);
  return today.endOf('month').date() - today.date() + 1;
};

const isSpend = (txn: CashTransaction): boolean =>
  !txn.isTransfer && !txn.matchedTxnId && txn.amountCents < 0;

const inBucket = (txn: CashTransaction, todayISO: string, format: string) =>
  dayjs(txn.dateISO).format(format) === dayjs(todayISO).format(format);

const spentWithin = (
  transactions: readonly CashTransaction[],
  todayISO: string,
  format: string
): number => {
  let spent = 0;
  for (const txn of transactions) {
    if (!isSpend(txn) || !inBucket(txn, todayISO, format)) continue;
    spent += Math.abs(txn.amountCents);
  }
  return spent;
};

export const spentThisMonthCents = (
  transactions: readonly CashTransaction[],
  todayISO: string
): number => spentWithin(transactions, todayISO, MONTH);

export const spentTodayCents = (
  transactions: readonly CashTransaction[],
  todayISO: string
): number => spentWithin(transactions, todayISO, DAY);

export const spendsThisMonth = (
  transactions: readonly CashTransaction[],
  todayISO: string
): CashTransaction[] =>
  transactions
    .filter((txn) => isSpend(txn) && inBucket(txn, todayISO, MONTH))
    .toSorted((a, b) => b.dateISO.localeCompare(a.dateISO));

export function burndownFor(
  balanceCents: number,
  transactions: readonly CashTransaction[],
  schedules: readonly CashSchedule[],
  todayISO: string
): Burndown {
  const reserveCents = reserveTotalCents(schedules, todayISO);
  const stillDueCents = dueThisMonthCents(schedules, todayISO);
  const daysRemaining = daysRemainingInMonth(todayISO);
  const spendableCents = balanceCents - reserveCents - stillDueCents;
  const todaySpent = spentTodayCents(transactions, todayISO);
  const allowanceTodayCents = Math.floor(
    (spendableCents + todaySpent) / daysRemaining
  );
  return {
    balanceCents,
    reserveCents,
    stillDueCents,
    spentThisMonthCents: spentThisMonthCents(transactions, todayISO),
    spentTodayCents: todaySpent,
    spendableCents,
    daysRemaining,
    perDayCents: Math.floor(spendableCents / daysRemaining),
    allowanceTodayCents,
    remainingTodayCents: allowanceTodayCents - todaySpent,
  };
}
