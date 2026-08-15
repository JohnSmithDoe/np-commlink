import { mockRitualCompletion } from '../testing/ritual.test-data';
import { completionOn, recentDayFlags, recentPromptIds } from './ritual.stats';

const on = (day: string, promptId = 'water') =>
  mockRitualCompletion({ promptId, completedAt: `${day}T08:00:00.000` });

describe('completionOn', () => {
  it('reads the calendar day off the timestamp, right up to midnight', () => {
    const log = [on('2026-07-20')];
    log[0]!.completedAt = '2026-07-20T23:59:59.999';

    expect(completionOn(log, '2026-07-20')).toBe(log[0]);
  });

  it('finds the day even though the log is a flat list', () => {
    const log = [on('2026-07-18'), on('2026-07-20'), on('2026-07-21')];

    expect(completionOn(log, '2026-07-20')?.completedAt).toContain(
      '2026-07-20'
    );
  });

  it('reports the last one, so a bonus does not hide what closed the day', () => {
    const log = [on('2026-07-20', 'water'), on('2026-07-20', 'stretch')];

    expect(completionOn(log, '2026-07-20')?.promptId).toBe('stretch');
  });

  it('is undefined on a day nothing was done — the day is open', () => {
    expect(completionOn([on('2026-07-18')], '2026-07-20')).toBeUndefined();
  });
});

describe('recentDayFlags', () => {
  it('runs oldest to newest, with today last', () => {
    const log = [on('2026-07-20'), on('2026-07-14')];

    expect(recentDayFlags(log, '2026-07-20', 7)).toEqual([
      true,
      false,
      false,
      false,
      false,
      false,
      true,
    ]);
  });

  it('counts a day once however many times it was done', () => {
    const log = [on('2026-07-20', 'water'), on('2026-07-20', 'stretch')];

    expect(recentDayFlags(log, '2026-07-20', 3)).toEqual([false, false, true]);
  });

  it('ignores anything older than the window rather than shifting it in', () => {
    expect(recentDayFlags([on('2026-06-01')], '2026-07-20', 7)).toEqual(
      Array.from({ length: 7 }, () => false)
    );
  });
});

describe('recentPromptIds', () => {
  it('collects what was done most recently, newest first', () => {
    const log = [
      on('2026-07-18', 'a'),
      on('2026-07-19', 'b'),
      on('2026-07-20', 'c'),
    ];

    expect([...recentPromptIds(log, 2)]).toEqual(['c', 'b']);
  });

  it('counts distinct prompts, not rows — a repeat does not fill the window', () => {
    const log = [
      on('2026-07-18', 'a'),
      on('2026-07-19', 'b'),
      on('2026-07-20', 'b'),
    ];

    expect([...recentPromptIds(log, 2)]).toEqual(['b', 'a']);
  });

  it('stops at the count instead of sweeping a log that only grows', () => {
    const log = Array.from({ length: 500 }, (_, index) =>
      on('2026-07-20', `p${index}`)
    );

    expect(recentPromptIds(log, 20).size).toBe(20);
    expect(recentPromptIds(log, 20).has('p499')).toBe(true);
    expect(recentPromptIds(log, 20).has('p0')).toBe(false);
  });

  it('is empty before anything has been done', () => {
    expect(recentPromptIds([], 20).size).toBe(0);
  });
});
