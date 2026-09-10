import dayjs from 'dayjs';
import { mockTaskItem } from '../testing/tasks.test-data';
import { dueStatusColor, nextDueAt, toggledDone } from './task.utils';

const NOW = dayjs('2026-07-26T12:00:00.000Z');
const MONTHLY = { every: 1, unit: 'month' } as const;

const colorOf = (dueAt?: string) =>
  dueStatusColor(mockTaskItem({ dueAt }), NOW);

const closedOn = (doneAt: string) =>
  dueStatusColor(mockTaskItem({ doneAt, interval: MONTHLY }), NOW);

const weekly = (doneAt: string) =>
  dueStatusColor(
    mockTaskItem({ doneAt, interval: { unit: 'week', every: 1 } }),
    NOW
  );

const yearly = (doneAt: string) =>
  dueStatusColor(
    mockTaskItem({ doneAt, interval: { unit: 'year', every: 1 } }),
    NOW
  );

describe('dueStatusColor', () => {
  it('gives a task without a due date no status at all', () => {
    expect(colorOf(undefined)).toBeUndefined();
  });

  it('measures an open task against its due date', () => {
    expect(colorOf('2026-07-20')).toBe('danger');
    expect(colorOf('2026-07-27')).toBe('warning');
    expect(colorOf('2026-09-01')).toBe('success');
  });

  it('leaves a finished task colourless', () => {
    const done = mockTaskItem({
      dueAt: '2026-01-01',
      doneAt: NOW.toISOString(),
    });
    expect(dueStatusColor(done, NOW)).toBeUndefined();
  });

  it('measures a closed recurring task against the date it comes round again', () => {
    expect(closedOn('2026-05-01')).toBe('danger');
    expect(closedOn('2026-06-27')).toBe('warning');
    expect(closedOn('2026-07-20')).toBe('success');
  });

  it('warns four days out on a task with no cadence to scale by', () => {
    expect(colorOf('2026-07-29')).toBe('warning');
    expect(colorOf('2026-07-31')).toBe('success');
  });

  it('scales the warning window to the cadence', () => {
    expect(weekly('2026-07-21')).toBe('warning');
    expect(weekly('2026-07-23')).toBe('success');

    expect(yearly('2025-08-05')).toBe('warning');
    expect(yearly('2025-09-01')).toBe('success');
  });

  it('never lets a chore due every day read as comfortable', () => {
    const everyDay = mockTaskItem({
      doneAt: '2026-07-26',
      interval: { unit: 'day', weekdays: [1, 2, 3, 4, 5, 6, 7] },
    });
    expect(dueStatusColor(everyDay, NOW)).toBe('warning');
  });

  it('ignores a due date the task already passed once it recurs', () => {
    const closed = mockTaskItem({
      dueAt: '2020-01-01',
      doneAt: '2026-07-20',
      interval: MONTHLY,
    });
    expect(dueStatusColor(closed, NOW)).toBe('success');
  });
});

describe('nextDueAt', () => {
  it('counts from the day the task was actually done', () => {
    const item = mockTaskItem({
      doneAt: '2026-07-20T18:00:00.000Z',
      interval: { every: 2, unit: 'week' },
    });
    expect(nextDueAt(item)).toBe('2026-08-03');
  });

  it('takes the soonest chosen weekday, never the day it was closed on', () => {
    const onMonAndThu = mockTaskItem({
      doneAt: '2026-07-20',
      interval: { unit: 'day', weekdays: [1, 4] },
    });
    expect(nextDueAt(onMonAndThu)).toBe('2026-07-23');

    const onMondayOnly = mockTaskItem({
      doneAt: '2026-07-20',
      interval: { unit: 'day', weekdays: [1] },
    });
    expect(nextDueAt(onMondayOnly)).toBe('2026-07-27');

    const sundays = mockTaskItem({
      doneAt: '2026-07-20',
      interval: { unit: 'day', weekdays: [7] },
    });
    expect(nextDueAt(sundays)).toBe('2026-07-26');
  });

  it('has no next date when no weekday is chosen', () => {
    const none = mockTaskItem({
      doneAt: '2026-07-20',
      interval: { unit: 'day', weekdays: [] },
    });
    expect(nextDueAt(none)).toBeUndefined();
  });

  it('clamps a month step onto a shorter month', () => {
    const item = mockTaskItem({ doneAt: '2026-01-31', interval: MONTHLY });
    expect(nextDueAt(item)).toBe('2026-02-28');
  });

  it('is nothing without both a close and an interval', () => {
    expect(nextDueAt(mockTaskItem({ doneAt: '2026-07-20' }))).toBeUndefined();
    expect(nextDueAt(mockTaskItem({ interval: MONTHLY }))).toBeUndefined();
  });
});

describe('toggledDone', () => {
  it('stamps the close', () => {
    expect(toggledDone(mockTaskItem(), NOW).doneAt).toBe(NOW.toISOString());
  });

  it('carries the overdue-ness into the reopened task', () => {
    const closed = mockTaskItem({ doneAt: '2026-05-01', interval: MONTHLY });
    const reopened = toggledDone(closed, NOW);

    expect(reopened.doneAt).toBeUndefined();
    expect(reopened.dueAt).toBe('2026-06-01');
    expect(dueStatusColor(reopened, NOW)).toBe('danger');
  });

  it('leaves a non-recurring task its own due date on reopen', () => {
    const closed = mockTaskItem({ dueAt: '2026-08-01', doneAt: '2026-05-01' });
    expect(toggledDone(closed, NOW).dueAt).toBe('2026-08-01');
  });
});
