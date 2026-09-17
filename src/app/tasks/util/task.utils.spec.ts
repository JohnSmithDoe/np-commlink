import dayjs from 'dayjs';
import { mockTaskItem } from '../testing/tasks.test-data';
import {
  closedTask,
  reopenedTask,
  dueStatusColor,
  nextDueOf,
  opensAt,
  tasksDueToReopen,
  toggledDone,
} from './task.utils';

const NOW = dayjs('2026-07-26T12:00:00.000Z');
const MONTHLY = { every: 1, unit: 'month' } as const;

const colorOf = (dueAt?: string) =>
  dueStatusColor(mockTaskItem({ dueAt }), NOW);

const closedOn = (doneAt: string) =>
  dueStatusColor(
    closedTask(mockTaskItem({ interval: MONTHLY }), dayjs(doneAt)),
    NOW
  );

const closedOnWeekdays = (weekdays: (1 | 4 | 7)[]) =>
  nextDueOf(
    closedTask(
      mockTaskItem({ interval: { unit: 'day', weekdays } }),
      dayjs('2026-07-20')
    )
  );

const openingWith = (overrides: Partial<Parameters<typeof mockTaskItem>[0]>) =>
  opensAt(mockTaskItem({ dueAt: '2026-07-15', ...overrides }));

const recurring = (doneAt: string, every: number, unit: 'week' | 'year') =>
  dueStatusColor(
    closedTask(mockTaskItem({ interval: { unit, every } }), dayjs(doneAt)),
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
    expect(closedOn('2026-06-27')).toBe('warning');
    expect(closedOn('2026-07-20')).toBe('success');
  });

  it('warns four days out on a task with no cadence to scale by', () => {
    expect(colorOf('2026-07-29')).toBe('warning');
    expect(colorOf('2026-07-31')).toBe('success');
  });

  it('scales the warning window to the cadence', () => {
    expect(recurring('2026-07-21', 1, 'week')).toBe('warning');
    expect(recurring('2026-07-23', 1, 'week')).toBe('success');

    expect(recurring('2025-08-05', 1, 'year')).toBe('warning');
    expect(recurring('2025-09-01', 1, 'year')).toBe('success');
  });

  it('moves the whole window when the shift says earlier', () => {
    const item = mockTaskItem({ dueAt: '2026-07-31' });
    expect(dueStatusColor(item, NOW)).toBe('success');
    expect(dueStatusColor(item, NOW, 'earlier')).toBe('warning');
  });
});

describe('closedTask', () => {
  it('counts from the close when the task is anchored to it', () => {
    const item = mockTaskItem({ interval: { every: 2, unit: 'week' } });
    expect(nextDueOf(closedTask(item, dayjs('2026-07-20T18:00:00.000Z')))).toBe(
      '2026-08-03'
    );
  });

  it('counts from the due date when the task is anchored to it', () => {
    const item = mockTaskItem({
      anchor: 'due',
      dueAt: '2026-07-20',
      interval: { every: 2, unit: 'week' },
    });
    expect(nextDueOf(closedTask(item, dayjs('2026-07-24')))).toBe('2026-08-03');
  });

  it('rolls a due-anchored task forward past every date already gone', () => {
    const item = mockTaskItem({
      anchor: 'due',
      dueAt: '2026-04-28',
      interval: { every: 1, unit: 'week' },
    });
    const closed = closedTask(item, NOW);

    expect(dayjs(nextDueOf(closed)).isAfter(NOW)).toBe(true);
    expect(nextDueOf(closed)).toBe('2026-07-28');
  });

  it('leaves a due date that is already in the future where it is', () => {
    const item = mockTaskItem({
      anchor: 'due',
      dueAt: '2026-07-21',
      interval: { every: 1, unit: 'week' },
    });

    const once = closedTask(item, dayjs('2026-07-21'));
    expect(nextDueOf(once)).toBe('2026-07-28');

    const twice = closedTask(reopenedTask(once), dayjs('2026-07-21'));
    const thrice = closedTask(reopenedTask(twice), dayjs('2026-07-21'));
    expect(nextDueOf(thrice)).toBe('2026-07-28');
    expect(thrice.dueAt).toBe('2026-07-21');
  });

  it('logs the dates it stepped over as misses, and the close itself', () => {
    const item = mockTaskItem({
      anchor: 'due',
      dueAt: '2026-07-05',
      interval: { every: 1, unit: 'week' },
    });
    const closings = closedTask(item, NOW).closings ?? [];

    expect(
      closings.filter((entry) => entry.missed).map((entry) => entry.on)
    ).toEqual(['2026-07-12', '2026-07-19', '2026-07-26']);
    expect(closings.at(-1)).toEqual({ on: '2026-07-26' });
  });

  it('takes the soonest chosen weekday, never the day it was closed on', () => {
    expect(closedOnWeekdays([1, 4])).toBe('2026-07-23');
    expect(closedOnWeekdays([1])).toBe('2026-07-27');
    expect(closedOnWeekdays([7])).toBe('2026-07-26');
  });

  it('lands on the next chosen month of the year', () => {
    const item = mockTaskItem({
      interval: { unit: 'monthsOfYear', months: [3, 6] },
    });
    expect(nextDueOf(closedTask(item, dayjs('2026-07-20')))).toBe('2027-03-01');
    expect(nextDueOf(closedTask(item, dayjs('2026-04-20')))).toBe('2026-06-01');
  });

  it('keeps the old due date when no occurrence can be computed', () => {
    const item = mockTaskItem({
      dueAt: '2026-08-01',
      interval: { unit: 'day', weekdays: [] },
    });
    expect(nextDueOf(closedTask(item, NOW))).toBe('2026-08-01');
  });

  it('clamps a month step onto a shorter month', () => {
    const item = mockTaskItem({ interval: MONTHLY });
    expect(nextDueOf(closedTask(item, dayjs('2026-01-31')))).toBe('2026-02-28');
  });

  it('comes back to the day the reader chose after a short month', () => {
    let item = mockTaskItem({
      anchor: 'due',
      dueAt: '2026-01-31',
      interval: MONTHLY,
    });
    const seen: (string | undefined)[] = [];

    for (const close of ['2026-01-31', '2026-02-28', '2026-03-31']) {
      item = reopenedTask(closedTask(item, dayjs(close)));
      seen.push(nextDueOf(item));
    }

    expect(seen).toEqual(['2026-02-28', '2026-03-31', '2026-04-30']);
  });

  it('records a close on a task with no cadence at all', () => {
    expect(closedTask(mockTaskItem(), NOW).closings).toEqual([
      { on: '2026-07-26' },
    ]);
  });
});

describe('opensAt', () => {
  it('opens on the day itself without a lead', () => {
    expect(openingWith({})).toBe('2026-07-15');
  });

  it('counts a lead in days back from the due date', () => {
    expect(openingWith({ lead: { kind: 'days', days: 3 } })).toBe('2026-07-12');
  });

  it('snaps a boundary lead to the start of its unit', () => {
    expect(openingWith({ lead: { kind: 'startOf', unit: 'month' } })).toBe(
      '2026-07-01'
    );
    expect(openingWith({ lead: { kind: 'startOf', unit: 'year' } })).toBe(
      '2026-01-01'
    );
  });

  it('never reaches back past the close, however long the lead', () => {
    const closed = closedTask(
      mockTaskItem({
        interval: { unit: 'day', weekdays: [2, 3] },
        lead: { kind: 'days', days: 2 },
      }),
      dayjs('2026-07-21')
    );

    expect(nextDueOf(closed)).toBe('2026-07-22');
    expect(opensAt(closed)).toBe('2026-07-22');
    expect(tasksDueToReopen([closed], dayjs('2026-07-21'))).toEqual([]);
    expect(tasksDueToReopen([closed], dayjs('2026-07-22'))).toEqual([closed]);
  });
});

describe('tasksDueToReopen', () => {
  const closed = mockTaskItem({
    doneAt: '2026-07-01T10:00:00.000Z',
    dueAt: '2026-07-27',
    interval: MONTHLY,
    lead: { kind: 'days', days: 3 },
  });

  const armed = (overrides: Partial<typeof closed>, now = NOW) =>
    tasksDueToReopen([{ ...closed, ...overrides }], now).length === 1;

  it('re-arms once the lead window is reached', () => {
    expect(armed({}, dayjs('2026-07-23'))).toBe(false);
    expect(armed({}, dayjs('2026-07-24'))).toBe(true);
  });

  it('re-arms every repeating task, with no opting out', () => {
    expect(armed({ lead: undefined }, dayjs('2026-07-26'))).toBe(false);
    expect(armed({ lead: undefined }, dayjs('2026-07-27'))).toBe(true);
  });

  it('never re-arms an open task or one with no cadence', () => {
    expect(armed({ doneAt: undefined })).toBe(false);
    expect(armed({ interval: undefined })).toBe(false);
  });

  it('picks only the armed tasks out of a list', () => {
    const items = [closed, { ...closed, id: 'later', dueAt: '2026-12-01' }];
    expect(tasksDueToReopen(items, dayjs('2026-07-24'))).toEqual([closed]);
  });
});

describe('toggledDone', () => {
  it('stamps the close', () => {
    expect(toggledDone(mockTaskItem(), NOW).doneAt).toBe(NOW.toISOString());
  });

  it('reopens without touching the date the close already computed', () => {
    const closed = closedTask(mockTaskItem({ interval: MONTHLY }), NOW);
    const reopened = toggledDone(closed, NOW);

    expect(reopened.doneAt).toBeUndefined();
    expect(nextDueOf(reopened)).toBe(nextDueOf(closed));
  });

  it('leaves a non-recurring task its own due date on reopen', () => {
    const closed = mockTaskItem({ dueAt: '2026-08-01', doneAt: '2026-05-01' });
    expect(toggledDone(closed, NOW).dueAt).toBe('2026-08-01');
  });
});
