import dayjs from 'dayjs';
import { ITrackingItem } from '../model/tracking.types';
import { dailySeries, groupSessionsByView } from './sessions.utils';

const track = (over: Partial<ITrackingItem> = {}): ITrackingItem => ({
  id: Math.random().toString(36).slice(2),
  name: 'Task',
  createdAt: '2026-01-01',
  state: 'stopped',
  ...over,
});

// These used to be selectors that read `dayjs()` inside their projectors, so a
// spec could only ever say "relative to whenever this runs". The day is an
// argument now, which is what lets every case below name an exact date — and it
// is the same property the fix exists for: the day can change without the
// sessions changing.
const TODAY = '2026-07-21';
const at = (day: string, hour = 10): string =>
  dayjs(`${day}T00:00:00`).hour(hour).format();

describe('groupSessionsByView', () => {
  it('merges same-name entries within a monthly bucket', () => {
    const sessions = [
      track({
        name: 'A',
        startTime: '2026-05-01T09:00:00',
        trackedTimeInSeconds: 3600,
      }),
      track({
        name: 'A',
        startTime: '2026-05-20T09:00:00',
        trackedTimeInSeconds: 1800,
      }),
      track({
        name: 'B',
        startTime: '2026-05-10T09:00:00',
        trackedTimeInSeconds: 600,
      }),
    ];

    const grouped = groupSessionsByView(sessions, 'monthly', TODAY);
    const byName = Object.fromEntries(
      grouped.map((g) => [g.name, g.trackedTimeInSeconds])
    );

    expect(byName['A']).toBe(5400);
    expect(byName['B']).toBe(600);
  });

  // The row used to inherit the id of the last session merged into it, which
  // made "delete this row" delete exactly one of the sessions behind it.
  it('lists the sessions behind a merged row and keys the row by its bucket', () => {
    const sessions = [
      track({
        id: 's1',
        name: 'A',
        startTime: '2026-05-01T09:00:00',
        trackedTimeInSeconds: 3600,
      }),
      track({
        id: 's2',
        name: 'A',
        startTime: '2026-05-20T09:00:00',
        trackedTimeInSeconds: 1800,
      }),
    ];

    const [row] = groupSessionsByView(sessions, 'monthly', TODAY);

    expect(row.sessionIds).toEqual(['s1', 's2']);
    expect(row.id).toBe('202605A');
  });

  /**
   * The regression this whole change exists for. The same sessions, asked about
   * on two consecutive days, must answer differently — as a memoized selector
   * reading the clock they could not, so an app left open past midnight went on
   * listing yesterday under "Heute".
   */
  it('answers "today" for the day it is given, not the day it runs', () => {
    const sessions = [
      track({
        name: 'A',
        startTime: at('2026-07-21'),
        trackedTimeInSeconds: 60,
      }),
      track({
        name: 'B',
        startTime: at('2026-07-22'),
        trackedTimeInSeconds: 60,
      }),
    ];

    expect(
      groupSessionsByView(sessions, 'today', '2026-07-21').map((r) => r.name)
    ).toEqual(['A']);
    expect(
      groupSessionsByView(sessions, 'today', '2026-07-22').map((r) => r.name)
    ).toEqual(['B']);
  });

  it('keeps every session in a view that does not filter by day', () => {
    const sessions = [
      track({ name: 'A', startTime: at('2026-07-21') }),
      track({ name: 'B', startTime: at('2026-01-02') }),
    ];

    expect(groupSessionsByView(sessions, 'all', TODAY)).toHaveLength(2);
  });
});

describe('dailySeries', () => {
  it('buckets hours by name across a 21-day window ending on the given day', () => {
    const series = dailySeries(
      [
        track({ name: 'A', startTime: at(TODAY), trackedTimeInSeconds: 3600 }),
        track({ name: 'A', startTime: at(TODAY), trackedTimeInSeconds: 1800 }),
      ],
      [],
      TODAY
    );

    expect(series.days).toHaveLength(21);
    expect(series.days.at(-1)).toBe(TODAY);
    const a = series.series.find((s) => s.name === 'A')!;
    expect(a.hours).toHaveLength(21);
    // The given day is the last column in the window.
    expect(a.hours[20]).toBeCloseTo(1.5, 5);
  });

  // The same regression on the chart: the window head is the day, so it has to
  // move when the day does.
  it('moves the window with the day it is given', () => {
    const sessions = [
      track({
        name: 'A',
        startTime: at('2026-07-22'),
        trackedTimeInSeconds: 3600,
      }),
    ];

    // On the 21st, tomorrow's session is outside the window entirely.
    const before = dailySeries(sessions, [], '2026-07-21');
    expect(before.series).toEqual([]);

    const after = dailySeries(sessions, [], '2026-07-22');
    expect(after.series.find((s) => s.name === 'A')?.hours[20]).toBeCloseTo(
      1,
      5
    );
  });

  // Past the top 6 everything pools into one bucket, and that bucket carries no
  // name: it is not an activity, and only the render site can put the user's
  // language on it. It used to arrive labelled 'Other', in English.
  it('pools everything past the top six into one nameless bucket', () => {
    const session = (name: string, seconds: number) =>
      track({ name, startTime: at(TODAY), trackedTimeInSeconds: seconds });

    // Seven names, strictly descending — so the seventh, and only it, pools.
    const series = dailySeries(
      [
        session('a', 7000),
        session('b', 6000),
        session('c', 5000),
        session('d', 4000),
        session('e', 3000),
        session('f', 2000),
        session('g', 1800),
      ],
      [],
      TODAY
    );

    const named = series.series.filter((s) => s.name !== undefined);
    const remainder = series.series.filter((s) => s.name === undefined);
    expect(named.map((s) => s.name)).toEqual(['a', 'b', 'c', 'd', 'e', 'f']);
    expect(remainder).toHaveLength(1);
    expect(remainder[0].hours[20]).toBeCloseTo(0.5, 5);
  });

  it('emits no remainder bucket when every activity fits in the top six', () => {
    const series = dailySeries(
      [track({ name: 'only', startTime: at(TODAY) })],
      [],
      TODAY
    );

    expect(series.series.every((s) => s.name !== undefined)).toBe(true);
  });

  it('counts the live rows alongside the archived ones', () => {
    const series = dailySeries(
      [track({ name: 'A', startTime: at(TODAY), trackedTimeInSeconds: 1800 })],
      [track({ name: 'A', startTime: at(TODAY), trackedTimeInSeconds: 1800 })],
      TODAY
    );

    expect(series.series.find((s) => s.name === 'A')?.hours[20]).toBeCloseTo(
      1,
      5
    );
  });
});
