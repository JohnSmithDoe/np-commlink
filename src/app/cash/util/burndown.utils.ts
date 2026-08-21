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
  spendableCents: number;
  daysRemaining: number;
  perDayCents: number;
}

export const daysRemainingInMonth = (todayISO: string): number => {
  const today = dayjs(todayISO);
  return today.endOf('month').date() - today.date() + 1;
};

export const spentThisMonthCents = (
  transactions: readonly CashTransaction[],
  todayISO: string
): number => {
  const month = dayjs(todayISO).format('YYYY-MM');
  let spent = 0;
  for (const txn of transactions) {
    if (txn.isTransfer || txn.matchedTxnId) continue;
    if (txn.amountCents >= 0) continue;
    if (dayjs(txn.dateISO).format('YYYY-MM') !== month) continue;
    spent += Math.abs(txn.amountCents);
  }
  return spent;
};

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
  return {
    balanceCents,
    reserveCents,
    stillDueCents,
    spentThisMonthCents: spentThisMonthCents(transactions, todayISO),
    spendableCents,
    daysRemaining,
    perDayCents: Math.floor(spendableCents / daysRemaining),
  };
}
