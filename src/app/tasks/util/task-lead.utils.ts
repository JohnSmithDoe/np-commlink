/* ─── why ─────────────────────────────────────────────────────────
 * The offered leads are capped by the cadence's WIDEST gap, not by its
 * unit. A lead reaching further back than the gap opens the task on the
 * day it was closed, which `opensAt` clamps away — so offering it renders
 * a chip that silently does what the one beside it does. "Mon and Tue" has
 * gaps of one day and six, so five days is the most that can mean
 * anything; "Mon, Wed, Fri, Sun" has a widest gap of two, so one day is.
 * Every weekday picked leaves a gap of one, and then only "on the day"
 * survives — which is the right answer for a daily chore.
 *
 * A weekday cadence enumerates its days rather than reading a ladder: the
 * range is at most six, and a reader who picked two days wants to say
 * "four days before", not the nearest rung.
 *
 * A boundary reaches a variable distance — "start of the week" is six days
 * back on a Sunday and none on a Monday — so it is measured by its WORST
 * case, one day short of its own unit. That is the same test the offsets
 * take, which is why both go through `worstReach`.
 * ───────────────────────────────────────────────────────────────── */
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { Marker } from '../../@shared/model/app.types';
import { Interval, PeriodUnit } from '../../@shared/model/interval.types';
import { TaskLead } from '../model/task.types';

const ON_DAY = marker('tasks.lead.onDay');
const DAY_BEFORE = marker('tasks.lead.day');
const DAYS_BEFORE = marker('tasks.lead.days');
const WEEK_BEFORE = marker('tasks.lead.week');
const WEEKS_BEFORE = marker('tasks.lead.weeks');
const MONTH_BEFORE = marker('tasks.lead.month');
const MONTHS_BEFORE = marker('tasks.lead.months');
const START_OF_WEEK = marker('tasks.lead.startOfWeek');
const START_OF_MONTH = marker('tasks.lead.startOfMonth');
const START_OF_YEAR = marker('tasks.lead.startOfYear');

const DAYS_PER_WEEK = 7;
const DAYS_PER_MONTH = 30;
const MONTHS_PER_YEAR = 12;
const DAYS_PER_YEAR = MONTHS_PER_YEAR * DAYS_PER_MONTH;

const UNIT_DAYS: Readonly<Record<PeriodUnit, number>> = {
  week: DAYS_PER_WEEK,
  month: DAYS_PER_MONTH,
  year: DAYS_PER_YEAR,
};

interface LeadOption {
  lead: TaskLead;
  key: Marker;
  params?: Record<string, number>;
}

export const ON_DAY_LEAD: TaskLead = { kind: 'days', days: 0 };

const onDay: LeadOption = { lead: ON_DAY_LEAD, key: ON_DAY };

const daysBefore = (days: number): LeadOption => ({
  lead: { kind: 'days', days },
  key: days === 1 ? DAY_BEFORE : DAYS_BEFORE,
  params: { count: days },
});

const weeksBefore = (weeks: number): LeadOption => ({
  lead: { kind: 'days', days: weeks * DAYS_PER_WEEK },
  key: weeks === 1 ? WEEK_BEFORE : WEEKS_BEFORE,
  params: { count: weeks },
});

const monthsBefore = (months: number): LeadOption => ({
  lead: { kind: 'days', days: months * DAYS_PER_MONTH },
  key: months === 1 ? MONTH_BEFORE : MONTHS_BEFORE,
  params: { count: months },
});

const startOf = (unit: PeriodUnit, key: Marker): LeadOption => ({
  lead: { kind: 'startOf', unit },
  key,
});

const LADDER: Readonly<Record<PeriodUnit, readonly LeadOption[]>> = {
  week: [
    daysBefore(1),
    daysBefore(3),
    weeksBefore(1),
    startOf('week', START_OF_WEEK),
  ],
  month: [
    daysBefore(3),
    weeksBefore(1),
    weeksBefore(2),
    monthsBefore(1),
    startOf('month', START_OF_MONTH),
  ],
  year: [
    weeksBefore(2),
    monthsBefore(1),
    monthsBefore(3),
    monthsBefore(6),
    startOf('year', START_OF_YEAR),
  ],
};

const widestCycleGap = (values: readonly number[], cycle: number): number => {
  const sorted = [...new Set(values)].toSorted((a, b) => a - b);
  const first = sorted.at(0);
  const last = sorted.at(-1);
  if (first === undefined || last === undefined) return cycle;

  let widest = first + cycle - last;
  let previous = first;
  for (const value of sorted) {
    widest = Math.max(widest, value - previous);
    previous = value;
  }
  return widest;
};

export const gapDaysOf = (interval: Interval): number => {
  if (interval.unit === 'day') {
    return widestCycleGap(interval.weekdays, DAYS_PER_WEEK);
  }
  if (interval.unit === 'monthsOfYear') {
    return widestCycleGap(interval.months, MONTHS_PER_YEAR) * DAYS_PER_MONTH;
  }
  return interval.every * UNIT_DAYS[interval.unit];
};

const worstReach = (lead: TaskLead): number =>
  lead.kind === 'days' ? lead.days : UNIT_DAYS[lead.unit] - 1;

const everyDayUpTo = (max: number): LeadOption[] =>
  Array.from({ length: Math.max(0, max) }, (_, index) => daysBefore(index + 1));

export const leadOptionsFor = (interval: Interval): readonly LeadOption[] => {
  const gap = gapDaysOf(interval);
  const ladder =
    interval.unit === 'day'
      ? everyDayUpTo(gap - 1)
      : LADDER[interval.unit === 'monthsOfYear' ? 'year' : interval.unit];

  return [onDay, ...ladder.filter((option) => worstReach(option.lead) < gap)];
};
