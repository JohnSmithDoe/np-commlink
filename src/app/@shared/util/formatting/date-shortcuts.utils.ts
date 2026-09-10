/* ─── why ─────────────────────────────────────────────────────────
 * Two rules, deliberately not one. `week` and `weekend` name a DAY and
 * always move forward, so Friday's "this week" is Friday next — a shortcut
 * that offered a date already gone would be worse than no shortcut.
 * `month` and `year` name a PERIOD and stay inside the one they name, so
 * the last of the month resolves to today rather than jumping a month and
 * making the label a lie.
 *
 * The consequence is accepted: on a Saturday `week` (Fri, +6) lands after
 * `weekend` (Sun, +1), and the row stops reading shortest-to-longest.
 *
 * `.day()` is Sunday-indexed in dayjs core, which is what is wanted here —
 * an absolute weekday, not a locale-relative one — so no plugin is pulled
 * in for arithmetic the core already does.
 * ───────────────────────────────────────────────────────────────── */
import dayjs, { Dayjs } from 'dayjs';
import { isoDay } from './date-format.utils';

export type DateShortcutId =
  'today' | 'tomorrow' | 'week' | 'weekend' | 'month' | 'year';

export const DATE_SHORTCUT_IDS: readonly DateShortcutId[] = [
  'today',
  'tomorrow',
  'week',
  'weekend',
  'month',
  'year',
];

const SUNDAY = 0;
const FRIDAY = 5;
const DAYS_PER_WEEK = 7;

export const nextWeekday = (now: Dayjs, weekday: number): Dayjs =>
  now.add(
    (weekday - now.day() + DAYS_PER_WEEK) % DAYS_PER_WEEK || DAYS_PER_WEEK,
    'day'
  );

const RESOLVE: Readonly<Record<DateShortcutId, (now: Dayjs) => Dayjs>> = {
  today: (now) => now,
  tomorrow: (now) => now.add(1, 'day'),
  week: (now) => nextWeekday(now, FRIDAY),
  weekend: (now) => nextWeekday(now, SUNDAY),
  month: (now) => now.endOf('month'),
  year: (now) => now.endOf('year'),
};

export const dateForShortcut = (
  id: DateShortcutId,
  now: Dayjs = dayjs()
): string => isoDay(RESOLVE[id](now));
