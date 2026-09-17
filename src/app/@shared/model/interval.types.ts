/* ─── why ─────────────────────────────────────────────────────────
 * Two kinds of cadence, not one bag of optional fields. A POSITIONED
 * cadence names a place on the calendar — "on Tuesdays", "in March and
 * June" — and so already says when it next falls due. An ELAPSED one
 * names a span and says nothing about where it starts, so whoever reads
 * it has to supply an anchor.
 *
 * Keeping them apart in the type is what lets a reader render an anchor
 * control only where an anchor exists: `isCalendarInterval` narrows, so a
 * positioned cadence cannot reach the branch that would ask.
 * ───────────────────────────────────────────────────────────────── */
import { IsoMonth, IsoWeekday } from './app.types';

const PERIOD_UNITS = ['week', 'month', 'year'] as const;

export type PeriodUnit = (typeof PERIOD_UNITS)[number];

type WeekdayInterval = { unit: 'day'; weekdays: readonly IsoWeekday[] };
type MonthsInterval = {
  unit: 'monthsOfYear';
  months: readonly IsoMonth[];
};
type ElapsedInterval = { unit: PeriodUnit; every: number };

export type Interval = WeekdayInterval | MonthsInterval | ElapsedInterval;

type CalendarInterval = WeekdayInterval | MonthsInterval;

export type IntervalUnit = Interval['unit'];

export const INTERVAL_UNITS = [
  'day',
  'week',
  'month',
  'monthsOfYear',
  'year',
] as const satisfies readonly IntervalUnit[];

export const isCalendarInterval = (
  interval: Interval
): interval is CalendarInterval =>
  interval.unit === 'day' || interval.unit === 'monthsOfYear';
