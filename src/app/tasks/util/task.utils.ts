import dayjs, { Dayjs } from 'dayjs';
import { IonColor } from '../../@shared/model/app.types';
import { TaskItem } from '../model/task.types';

const DUE_SOON_DAYS = 3;

export const dueStatusColor = (
  item: TaskItem,
  now: Dayjs = dayjs()
): IonColor | undefined => {
  if (item.doneAt || !item.dueAt) return undefined;
  const dueAt = dayjs(item.dueAt);
  if (dueAt.isBefore(now)) return 'danger';
  return dueAt.isBefore(now.add(DUE_SOON_DAYS, 'days')) ? 'warning' : 'success';
};
