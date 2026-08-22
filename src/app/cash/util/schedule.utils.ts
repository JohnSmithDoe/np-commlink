/* ─── why ─────────────────────────────────────────────────────────
 * The reserve is `amount ÷ monthsUntilDue`, not `amount ÷ periodMonths`.
 * The second is wrong in the first month a schedule exists: it claims 50 of a
 * 600 premium is already set aside when nothing is, and by the due month the
 * pot holds 50 instead of 600. Dividing by the months REMAINING needs no
 * accumulation history and no first-month exception — an app installed in
 * January reserves 300 a month for a March premium, which is steep and true.
 *
 * Nothing here is stored. The reserve is derived from the schedules on every
 * read, so there is no second ledger to disagree with the bank.
 *
 * An overdue schedule stays committed. Its money has not left, so releasing
 * it would report spendable cash that a late direct debit is about to take.
 * ───────────────────────────────────────────────────────────────── */
import dayjs from 'dayjs';
import {
  CashSchedule,
  ScheduleAmountChange,
  ScheduleDueStatus,
} from '../model/schedule.types';
import { CashTransaction } from '../model/transaction.types';
import { matchesRule } from './categorize.utils';

const asRule = (schedule: CashSchedule) => ({
  match: schedule.match,
  conditions: schedule.conditions,
});

export function matchesSchedule(
  txn: CashTransaction,
  schedule: CashSchedule
): boolean {
  return matchesRule(txn, asRule(schedule));
}

export function scheduleFor(
  txn: CashTransaction,
  schedules: readonly CashSchedule[]
): CashSchedule | undefined {
  return schedules.find((schedule) => matchesSchedule(txn, schedule));
}

export function monthsUntilDue(
  schedule: CashSchedule,
  todayISO: string
): number {
  const months = dayjs(schedule.nextDueISO)
    .startOf('month')
    .diff(dayjs(todayISO).startOf('month'), 'month');
  return Math.max(0, months);
}

export function dueStatus(
  schedule: CashSchedule,
  todayISO: string
): ScheduleDueStatus {
  const due = dayjs(schedule.nextDueISO);
  const today = dayjs(todayISO);
  if (due.isBefore(today, 'day')) return 'overdue';
  return due.isSame(today, 'month') ? 'due' : 'upcoming';
}

export function reserveCentsPerMonth(
  schedule: CashSchedule,
  todayISO: string
): number {
  const magnitude = Math.abs(schedule.amountCents);
  if (schedule.amountCents >= 0) return 0; // income is not a commitment
  const remaining = monthsUntilDue(schedule, todayISO);
  return remaining === 0 ? magnitude : Math.round(magnitude / remaining);
}

export function reserveTotalCents(
  schedules: readonly CashSchedule[],
  todayISO: string
): number {
  let total = 0;
  for (const schedule of schedules) {
    if (dueStatus(schedule, todayISO) !== 'upcoming') continue;
    total += reserveCentsPerMonth(schedule, todayISO);
  }
  return total;
}

export function dueThisMonthCents(
  schedules: readonly CashSchedule[],
  todayISO: string
): number {
  let total = 0;
  for (const schedule of schedules) {
    if (dueStatus(schedule, todayISO) === 'upcoming') continue;
    if (schedule.amountCents >= 0) continue;
    total += Math.abs(schedule.amountCents);
  }
  return total;
}

export function monthlyCommitmentCents(
  schedules: readonly CashSchedule[]
): number {
  let total = 0;
  for (const schedule of schedules) {
    if (schedule.amountCents >= 0) continue;
    total += Math.round(Math.abs(schedule.amountCents) / schedule.periodMonths);
  }
  return total;
}

export function confirmedThisMonthCents(
  schedules: readonly CashSchedule[],
  todayISO: string
): number {
  const month = dayjs(todayISO);
  let total = 0;
  for (const schedule of schedules) {
    if (schedule.amountCents >= 0) continue;
    if (!schedule.lastSeenISO) continue;
    if (!dayjs(schedule.lastSeenISO).isSame(month, 'month')) continue;
    total += Math.abs(schedule.amountCents);
  }
  return total;
}

export function seenThisMonth(
  schedule: CashSchedule,
  todayISO: string
): boolean {
  return (
    !!schedule.lastSeenISO &&
    dayjs(schedule.lastSeenISO).isSame(dayjs(todayISO), 'month')
  );
}

export function scheduleSightingsFor(
  incoming: readonly CashTransaction[],
  schedules: readonly CashSchedule[]
): ScheduleAmountChange[] {
  const claimed = new Set<string>();
  const sightings: ScheduleAmountChange[] = [];
  for (const txn of incoming) {
    const schedule = schedules.find(
      (candidate) =>
        !claimed.has(candidate.id) && matchesSchedule(txn, candidate)
    );
    if (!schedule) continue;
    claimed.add(schedule.id);
    sightings.push({
      scheduleId: schedule.id,
      fromCents: schedule.amountCents,
      toCents: txn.amountCents,
      transactionId: txn.id,
      seenISO: txn.dateISO,
    });
  }
  return sightings;
}

export const changedAmounts = (
  sightings: readonly ScheduleAmountChange[]
): ScheduleAmountChange[] =>
  sightings.filter(({ fromCents, toCents }) => fromCents !== toCents);

export function advanced(
  schedule: CashSchedule,
  seenISO: string
): CashSchedule {
  return {
    ...schedule,
    lastSeenISO: seenISO,
    nextDueISO: dayjs(schedule.nextDueISO)
      .add(schedule.periodMonths, 'month')
      .format(),
  };
}
