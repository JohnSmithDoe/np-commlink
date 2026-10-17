/* ─── why ─────────────────────────────────────────────────────────
 * One advance serves every cadence; only the SEED differs. An obligation
 * counts from the date it was due, maintenance from the date it was closed,
 * and a calendar cadence from either — "on Tuesdays" names the same Tuesday
 * whichever you hand it. That is why `anchorOf` is consulted in one place.
 *
 * A seed already in the future is the ANSWER, not a starting point. Without
 * that, closing twice stepped twice and a stray tick and untick pushed the
 * schedule out a whole interval — and nothing in the data distinguishes a
 * correction from doing the task again, so advancing has to be idempotent.
 *
 * `dueAt` is the reader's entry and is never written here; `nextDueAt` is
 * where the schedule moves, and `nextDueOf` falls back so that tasks stored
 * before the split still answer.
 *
 * Keeping that entry is also what stops a monthly cadence sliding off its
 * day: a month added to the 31st lands on the 28th, and a month added to
 * THAT keeps the 28th forever. Each step re-applies the day `dueAt` names,
 * clamped to the month it lands in — meaningless for a weekly cadence, so
 * `week` is excluded rather than silently dragged onto a day number.
 * ───────────────────────────────────────────────────────────────── */
import dayjs, { Dayjs } from 'dayjs';
import {
  IonColor,
  IsoMonth,
  IsoWeekday,
  Timestamp,
} from '../../@shared/model/app.types';
import {
  ElapsedInterval,
  Interval,
  isCalendarInterval,
} from '../../@shared/model/interval.types';
import { isoDay } from '../../@shared/util/formatting/date-format.utils';
import { nextWeekday } from '../../@shared/util/formatting/date-shortcuts.utils';
import {
  TaskAnchor,
  TaskClosing,
  TaskItem,
  TaskLead,
  TaskSettings,
  TaskWarnShift,
} from '../model/task.types';

const DUE_SOON_DAYS = 4;
const WARN_FRACTION = 0.25;
const WARN_MIN_DAYS = 1;
const WARN_MAX_DAYS = 14;
const SUNDAY = 7;
const MAX_ROLL_STEPS = 500;
const MAX_CLOSINGS = 200;

const WARN_SHIFT: Readonly<Record<TaskWarnShift, number>> = {
  earlier: 2,
  normal: 1,
  later: 0.5,
};

const asDayjsDay = (weekday: IsoWeekday): number =>
  weekday === SUNDAY ? 0 : weekday;

const soonestWeekday = (
  from: Dayjs,
  weekdays: readonly IsoWeekday[]
): Dayjs | undefined => {
  return weekdays
    .map((weekday) => nextWeekday(from, asDayjsDay(weekday)))
    .toSorted((a, b) => a.valueOf() - b.valueOf())
    .at(0);
};

const soonestMonth = (
  from: Dayjs,
  months: readonly IsoMonth[]
): Dayjs | undefined => {
  return months
    .map((month) => {
      const thisYear = from.month(month - 1).startOf('month');
      return thisYear.isAfter(from) ? thisYear : thisYear.add(1, 'year');
    })
    .toSorted((a, b) => a.valueOf() - b.valueOf())
    .at(0);
};

export const stepFrom = (
  from: Dayjs,
  interval: Interval,
  anchorDay?: number
): Dayjs | undefined => {
  if (interval.unit === 'day') return soonestWeekday(from, interval.weekdays);
  if (interval.unit === 'monthsOfYear') {
    return soonestMonth(from, interval.months);
  }
  const next = from.add(interval.every, interval.unit);
  return anchorDay && interval.unit !== 'week'
    ? next.date(Math.min(anchorDay, next.daysInMonth()))
    : next;
};

const anchorOf = (item: TaskItem): TaskAnchor => item.anchor ?? 'done';

export const nextDueOf = (item: TaskItem): Timestamp | undefined =>
  item.nextDueAt ?? item.dueAt;

const anchorDayOf = (item: TaskItem): number | undefined =>
  item.dueAt ? dayjs(item.dueAt).date() : undefined;

const seedFor = (item: TaskItem, now: Dayjs): Dayjs => {
  const due = nextDueOf(item);
  return due && anchorOf(item) === 'due' ? dayjs(due) : now;
};

const nthElapsedStep = (
  seed: Dayjs,
  interval: ElapsedInterval,
  steps: number,
  anchorDay?: number
): Dayjs => {
  const next = seed.add(steps * interval.every, interval.unit);
  return anchorDay && interval.unit !== 'week'
    ? next.date(Math.min(anchorDay, next.daysInMonth()))
    : next;
};

const advanceElapsed = (
  seed: Dayjs,
  interval: ElapsedInterval,
  now: Dayjs,
  anchorDay?: number
): { next: Timestamp; missed: Timestamp[] } => {
  const nth = (steps: number) =>
    nthElapsedStep(seed, interval, steps, anchorDay);
  let steps = Math.max(
    1,
    Math.floor(now.diff(seed, interval.unit) / interval.every)
  );
  while (!nth(steps).isAfter(now)) steps++;
  while (steps > 1 && nth(steps - 1).isAfter(now)) steps--;

  const firstLogged = Math.max(1, steps - MAX_CLOSINGS);
  const missed = Array.from({ length: steps - firstLogged }, (_, index) =>
    isoDay(nth(firstLogged + index))
  );
  return { next: isoDay(nth(steps)), missed };
};

const advancePositioned = (
  seed: Dayjs,
  interval: Interval,
  now: Dayjs
): { next?: Timestamp; missed: Timestamp[] } => {
  const missed: Timestamp[] = [];
  let cursor = stepFrom(seed, interval);
  for (let step = 0; step < MAX_ROLL_STEPS; step++) {
    if (!cursor || cursor.isAfter(now)) break;
    missed.push(isoDay(cursor));
    const following = stepFrom(cursor, interval);
    if (!following?.isAfter(cursor)) break;
    cursor = following;
  }
  return { next: cursor && isoDay(cursor), missed };
};

const advanceFrom = (
  seed: Dayjs,
  interval: Interval,
  now: Dayjs,
  anchorDay?: number
): { next?: Timestamp; missed: Timestamp[] } => {
  if (seed.isAfter(now, 'day')) return { next: isoDay(seed), missed: [] };
  return isCalendarInterval(interval) || interval.every < 1
    ? advancePositioned(seed, interval, now)
    : advanceElapsed(seed, interval, now, anchorDay);
};

export const nextDueForCadence = (
  item: TaskItem,
  interval: Interval | undefined,
  now: Dayjs = dayjs()
): Timestamp | undefined => {
  const due = item.dueAt ? dayjs(item.dueAt) : undefined;
  if (!interval || !due || !due.isBefore(now, 'day')) return item.dueAt;
  const next = stepFrom(now, interval, anchorDayOf(item));
  return next ? isoDay(next) : item.dueAt;
};

export const recursAt = (item: TaskItem): Timestamp | undefined =>
  item.doneAt && item.interval ? nextDueOf(item) : undefined;

const cappedClosings = (
  existing: readonly TaskClosing[] | undefined,
  added: readonly TaskClosing[]
): readonly TaskClosing[] =>
  [...(existing ?? []), ...added].slice(-MAX_CLOSINGS);

export const closedTask = (item: TaskItem, now: Dayjs = dayjs()): TaskItem => {
  const closed: TaskClosing = { on: isoDay(now) };
  if (!item.interval) {
    return {
      ...item,
      doneAt: now.toISOString(),
      closings: cappedClosings(item.closings, [closed]),
    };
  }

  const { next, missed } = advanceFrom(
    seedFor(item, now),
    item.interval,
    now,
    anchorDayOf(item)
  );
  return {
    ...item,
    doneAt: now.toISOString(),
    nextDueAt: next ?? nextDueOf(item),
    closings: cappedClosings(item.closings, [
      ...missed.map((on): TaskClosing => ({ on, missed: true })),
      closed,
    ]),
  };
};

export const reopenedTask = (item: TaskItem): TaskItem => {
  return {
    ...item,
    doneAt: undefined,
  };
};

export const toggledDone = (item: TaskItem, now: Dayjs = dayjs()): TaskItem =>
  item.doneAt ? reopenedTask(item) : closedTask(item, now);

const leadFrom = (due: Dayjs, lead: TaskLead | undefined): Dayjs => {
  if (!lead) return due;
  return lead.kind === 'days'
    ? due.subtract(lead.days, 'day')
    : due.startOf(lead.unit);
};

export const opensAt = (item: TaskItem): Timestamp | undefined => {
  const due = nextDueOf(item);
  if (!due) return undefined;
  const opens = leadFrom(dayjs(due), item.lead);
  const earliest = item.doneAt ? dayjs(item.doneAt).add(1, 'day') : undefined;
  return isoDay(earliest?.isAfter(opens) ? earliest : opens);
};

const isDueToReopen = (item: TaskItem, now: Dayjs): boolean => {
  if (!item.doneAt || !item.interval) return false;
  const opens = opensAt(item);
  return opens !== undefined && !dayjs(opens).isAfter(now, 'day');
};

export const tasksDueToReopen = (
  items: readonly TaskItem[],
  now: Dayjs
): TaskItem[] => items.filter((item) => isDueToReopen(item, now));

const warnDaysBefore = (
  item: TaskItem,
  due: Dayjs,
  shift: TaskWarnShift
): number => {
  const factor = WARN_SHIFT[shift];
  if (!item.doneAt) return Math.round(DUE_SOON_DAYS * factor);
  const span = due.diff(dayjs(item.doneAt), 'day') * WARN_FRACTION * factor;
  return Math.round(Math.min(Math.max(span, WARN_MIN_DAYS), WARN_MAX_DAYS));
};

export const dueStatusColor = (
  item: TaskItem,
  now: Dayjs = dayjs(),
  shift: TaskWarnShift = 'normal'
): IonColor | undefined => {
  if (item.doneAt && !item.interval) return undefined;
  const target = nextDueOf(item);
  if (!target) return undefined;
  const due = dayjs(target);
  if (due.isBefore(now)) return 'danger';
  return due.isBefore(now.add(warnDaysBefore(item, due, shift), 'day'))
    ? 'warning'
    : 'success';
};

export const seededTaskDefaults = (
  settings: TaskSettings
): Pick<TaskItem, 'anchor'> => {
  return {
    anchor: settings.defaultAnchor,
  };
};
