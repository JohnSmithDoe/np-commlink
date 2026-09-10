/* ─── why ─────────────────────────────────────────────────────────
 * One colour rule over two different dates. An open task is measured
 * against the date it is due; a CLOSED one against the date its interval
 * says it comes round again, which is why `doneAt` stops the colour only
 * when nothing brings the task back. A closed task without an interval is
 * finished, and finished is colourless.
 *
 * The next date is computed from `doneAt` — when the task was actually
 * done, not when it was meant to be — so a chore done three weeks late
 * runs its full interval from there. That also means there is no
 * day-of-month to keep sticky, and none of the clamping a fixed calendar
 * schedule needs.
 * ───────────────────────────────────────────────────────────────── */
import dayjs, { Dayjs } from 'dayjs';
import { IonColor, IsoWeekday, Timestamp } from '../../@shared/model/app.types';
import { Interval } from '../../@shared/model/interval.types';
import { isoDay } from '../../@shared/util/formatting/date-format.utils';
import { nextWeekday } from '../../@shared/util/formatting/date-shortcuts.utils';
import { TaskItem } from '../model/task.types';

const DUE_SOON_DAYS = 3;
const SUNDAY = 7;

const asDayjsDay = (weekday: IsoWeekday): number =>
  weekday === SUNDAY ? 0 : weekday;

const soonestWeekday = (
  done: Dayjs,
  weekdays: readonly IsoWeekday[]
): Dayjs | undefined =>
  weekdays
    .map((weekday) => nextWeekday(done, asDayjsDay(weekday)))
    .toSorted((a, b) => a.valueOf() - b.valueOf())
    .at(0);

const nextFrom = (done: Dayjs, interval: Interval): Dayjs | undefined =>
  interval.unit === 'day'
    ? soonestWeekday(done, interval.weekdays)
    : done.add(interval.every, interval.unit);

export const nextDueAt = (item: TaskItem): Timestamp | undefined => {
  if (!item.doneAt || !item.interval) return;
  const next = nextFrom(dayjs(item.doneAt), item.interval);
  return next && isoDay(next);
};

const statusDate = (item: TaskItem): Timestamp | undefined =>
  item.doneAt ? nextDueAt(item) : item.dueAt;

export const dueStatusColor = (
  item: TaskItem,
  now: Dayjs = dayjs()
): IonColor | undefined => {
  const target = statusDate(item);
  if (!target) return undefined;
  const due = dayjs(target);
  if (due.isBefore(now)) return 'danger';
  return due.isBefore(now.add(DUE_SOON_DAYS, 'days')) ? 'warning' : 'success';
};

export const toggledDone = (item: TaskItem, now: Dayjs = dayjs()): TaskItem =>
  item.doneAt
    ? { ...item, doneAt: undefined, dueAt: nextDueAt(item) ?? item.dueAt }
    : { ...item, doneAt: now.toISOString() };
