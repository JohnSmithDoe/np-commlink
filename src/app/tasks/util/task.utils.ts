import dayjs, { Dayjs } from 'dayjs';
import { TColor } from '../../@shared/model/app.types';
import { ITaskItem } from '../model/task.types';

// How close a due date has to be before a task is flagged as pressing rather
// than merely open.
const DUE_SOON_DAYS = 3;

/**
 * A task's urgency as the row's status colour: overdue is `danger`, due within
 * the next {@link DUE_SOON_DAYS} days is `warning`, everything else — a task
 * with no due date included — is `success`.
 *
 * `now` is a parameter so the rule is a pure function of its inputs; the page
 * calls it without one.
 */
export const dueStatusColor = (
  item: ITaskItem,
  now: Dayjs = dayjs()
): TColor => {
  if (!item.dueAt) return 'success';
  const dueAt = dayjs(item.dueAt);
  if (dueAt.isBefore(now)) return 'danger';
  return dueAt.isBefore(now.add(DUE_SOON_DAYS, 'days')) ? 'warning' : 'success';
};
