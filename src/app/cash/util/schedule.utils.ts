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
import { doesMatchRule } from './categorize.utils';

const asRule = (schedule: CashSchedule) => {
  return {
    match: schedule.match,
    conditions: schedule.conditions,
  };
};

export function doesMatchSchedule(
  txn: CashTransaction,
  schedule: CashSchedule
): boolean {
  return doesMatchRule(txn, asRule(schedule));
}

export function scheduleFor(
  txn: CashTransaction,
  schedules: readonly CashSchedule[]
): CashSchedule | undefined {
  return schedules.find((schedule) => doesMatchSchedule(txn, schedule));
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
    if (
      dueStatus(schedule, todayISO) === 'upcoming' ||
      schedule.amountCents >= 0
    )
      continue;
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
    if (
      schedule.amountCents >= 0 ||
      !schedule.lastSeenISO ||
      !dayjs(schedule.lastSeenISO).isSame(month, 'month')
    )
      continue;
    total += Math.abs(schedule.amountCents);
  }
  return total;
}

export function wasSeenThisMonth(
  schedule: CashSchedule,
  todayISO: string
): boolean {
  return (
    !!schedule.lastSeenISO &&
    dayjs(schedule.lastSeenISO).isSame(dayjs(todayISO), 'month')
  );
}

const isSightingOf = (
  txn: CashTransaction,
  schedule: CashSchedule
): boolean => {
  return (
    Math.sign(txn.amountCents) === Math.sign(schedule.amountCents) &&
    (!schedule.lastSeenISO ||
      dayjs(txn.dateISO).isAfter(schedule.lastSeenISO)) &&
    doesMatchSchedule(txn, schedule)
  );
};

export function scheduleSightingsFor(
  incoming: readonly CashTransaction[],
  schedules: readonly CashSchedule[]
): ScheduleAmountChange[] {
  const claimed = new Set<string>();
  const sightings: ScheduleAmountChange[] = [];
  const newestFirst = incoming.toSorted((a, b) =>
    dayjs(b.dateISO).diff(a.dateISO)
  );
  for (const txn of newestFirst) {
    const schedule = schedules.find(
      (candidate) => !claimed.has(candidate.id) && isSightingOf(txn, candidate)
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

const occurrence = (
  schedule: CashSchedule,
  dueDay: number,
  periods: number
): dayjs.Dayjs => {
  const month = dayjs(schedule.nextDueISO).add(
    periods * schedule.periodMonths,
    'month'
  );
  return month.date(Math.min(dueDay, month.daysInMonth()));
};

const periodsToNearestOccurrence = (
  schedule: CashSchedule,
  dueDay: number,
  seenISO: string
): number => {
  const seen = dayjs(seenISO);
  const before = Math.floor(
    seen.diff(schedule.nextDueISO, 'month', true) / schedule.periodMonths
  );
  const distance = (periods: number) =>
    Math.abs(seen.diff(occurrence(schedule, dueDay, periods)));
  return distance(before) <= distance(before + 1) ? before : before + 1;
};

export function advanced(
  schedule: CashSchedule,
  seenISO: string
): CashSchedule {
  const dueDay = schedule.dueDay ?? dayjs(schedule.nextDueISO).date();
  const paid = Math.max(
    periodsToNearestOccurrence(schedule, dueDay, seenISO),
    -1
  );
  return {
    ...schedule,
    dueDay,
    lastSeenISO: seenISO,
    nextDueISO: occurrence(schedule, dueDay, paid + 1).format(),
  };
}
