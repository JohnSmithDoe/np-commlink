/* ─── why ─────────────────────────────────────────────────────────
 * v1 computed a recurring task's next date on every read, from
 * `doneAt + interval`; v2 stores it in `nextDueAt`, beside the `dueAt` the
 * reader typed and the app never writes. The rung therefore writes down the
 * answer v1 would have given rather than the answer v2 would reach today —
 * one step, no roll-forward — so a task's colour is identical either side of
 * the hop and the step needs no clock to be pinned by a spec.
 *
 * Every dated task gets a `nextDueAt`, not just the recurring ones: the list
 * sorts on that field through the shared comparator, which reads a raw key
 * and cannot fall back.
 *
 * Written against `unknown` and casting once: the v1 types it reads are
 * gone from the source, so the shape below is the only record of them.
 * ───────────────────────────────────────────────────────────────── */
import dayjs from 'dayjs';
import { MigrationStep } from '../../@shared/util/persistence/versioned';
import { Interval } from '../../@shared/model/interval.types';
import { isoDay } from '../../@shared/util/formatting/date-format.utils';
import {
  DEFAULT_TASK_SETTINGS,
  TaskClosing,
  TasksState,
} from '../model/task.types';
import { stepFrom } from '../util/task.utils';

type V1Task = {
  id: string;
  dueAt?: string;
  doneAt?: string;
  interval?: Interval;
};

type V1State = {
  list?: { items?: V1Task[] };
  categoryList?: unknown;
};

const migratedTask = (
  task: V1Task
): V1Task & {
  nextDueAt?: string;
  closings?: readonly TaskClosing[];
} => {
  const dated = task.dueAt ? { ...task, nextDueAt: task.dueAt } : task;
  if (!task.doneAt) return dated;

  const closings: TaskClosing[] = [{ on: isoDay(task.doneAt) }];
  if (!task.interval) return { ...dated, closings };

  const next = stepFrom(dayjs(task.doneAt), task.interval);
  return { ...dated, nextDueAt: next ? isoDay(next) : task.dueAt, closings };
};

export const tasksV1ToV2: MigrationStep = (data) => {
  const state = data as V1State;
  return {
    ...state,
    list: {
      ...state.list,
      items: (state.list?.items ?? []).map((task) => migratedTask(task)),
    },
    settings: DEFAULT_TASK_SETTINGS,
  } as unknown as TasksState;
};

export const tasksLadder: MigrationStep[] = [tasksV1ToV2];
