import { ITrackingItem } from '../model/tracking.types';
import { TrackingActions } from './tracking.actions';
import { initialState, trackingReducer } from './tracking.reducer';

const track = (over: Partial<ITrackingItem> = {}): ITrackingItem => ({
  id: '1',
  name: 'Task',
  createdAt: '2026-01-01',
  state: 'stopped',
  ...over,
});

const withItems = (items: ITrackingItem[]) => ({ ...initialState, items });

describe('trackingReducer', () => {
  it('adds, updates, removes and searches list items', () => {
    const added = trackingReducer(
      initialState,
      TrackingActions.addItem(track({ id: 'a', name: 'A' }))
    );
    expect(added.items.map((index) => index.id)).toEqual(['a']);

    const updated = trackingReducer(
      added,
      TrackingActions.updateItem({
        id: 'a',
        name: 'A2',
        createdAt: '2026-01-01',
      })
    );
    expect(updated.items[0].name).toBe('A2');

    const removed = trackingReducer(
      updated,
      TrackingActions.removeItem(track({ id: 'a' }))
    );
    expect(removed.items).toHaveLength(0);

    const searched = trackingReducer(
      initialState,
      TrackingActions.updateSearch('foo')
    );
    expect(searched.searchQuery).toBe('foo');
  });

  describe('toggleTrackingItem', () => {
    const now = '2026-06-01T10:00:00';

    it('starts a stopped item and stops any other running item', () => {
      const state = withItems([
        track({ id: 'a', state: 'stopped' }),
        track({ id: 'b', state: 'running', startTime: '2026-06-01T08:00:00' }),
      ]);
      const next = trackingReducer(
        state,
        TrackingActions.toggleTrackingItem(track({ id: 'a' }), now)
      );

      const a = next.items.find((index) => index.id === 'a')!;
      const b = next.items.find((index) => index.id === 'b')!;
      expect(a.state).toBe('running');
      expect(a.startTime).toBe(now);
      expect(a.trackedTimeInSeconds).toBe(0);
      expect(b.state).toBe('stopped');
      expect(b.breakTime).toBe(now);
    });

    it('pauses a running item', () => {
      const state = withItems([
        track({ id: 'a', state: 'running', startTime: '2026-06-01T08:00:00' }),
      ]);
      const next = trackingReducer(
        state,
        TrackingActions.toggleTrackingItem(
          track({ id: 'a', state: 'running' }),
          now
        )
      );

      expect(next.items[0].state).toBe('paused');
      expect(next.items[0].breakTime).toBe(now);
    });
  });

  it('computes elapsed time on updateTracking, minus break time', () => {
    const state = withItems([
      track({
        id: 'a',
        state: 'running',
        startTime: '2026-06-01T09:00:00',
        breakInSeconds: 600,
      }),
    ]);
    const next = trackingReducer(
      state,
      TrackingActions.updateTracking(track({ id: 'a' }), '2026-06-01T10:00:00')
    );
    // 3600s running - 600s break = 3000s
    expect(next.items[0].trackedTimeInSeconds).toBe(3000);
  });

  it('resets a single item and all items', () => {
    const state = withItems([
      track({
        id: 'a',
        state: 'running',
        startTime: 'x',
        trackedTimeInSeconds: 99,
      }),
      track({
        id: 'b',
        state: 'paused',
        startTime: 'y',
        trackedTimeInSeconds: 5,
      }),
    ]);

    const one = trackingReducer(
      state,
      TrackingActions.resetTracking(track({ id: 'a' }))
    );
    expect(
      one.items.find((index) => index.id === 'a')!.trackedTimeInSeconds
    ).toBeUndefined();
    expect(
      one.items.find((index) => index.id === 'b')!.trackedTimeInSeconds
    ).toBe(5);

    const all = trackingReducer(state, TrackingActions.resetAllTracking());
    expect(
      all.items.every((index) => index.state === 'stopped' && !index.startTime)
    ).toBe(true);
  });

  describe('saveAndReset', () => {
    const started = withItems([
      track({
        id: 'a',
        name: 'Started',
        state: 'paused',
        startTime: '2026-06-01T09:00:00',
        trackedTimeInSeconds: 100,
      }),
      track({ id: 'b', name: 'Untouched', state: 'stopped' }),
    ]);

    it('archives started items into sessions and resets the list', () => {
      const next = trackingReducer(
        started,
        TrackingActions.saveAndResetTracking()
      );

      expect(next.sessions).toHaveLength(1);
      expect(next.sessions[0].name).toBe('Started');
      expect(
        next.items.every(
          (index) => !index.startTime && index.state === 'stopped'
        )
      ).toBe(true);
    });

    // The arm used to mint a uuid, which made the reducer's output depend on
    // something other than (state, action).
    it('derives the archived id from the run it archives, so it is reproducible', () => {
      const once = trackingReducer(
        started,
        TrackingActions.saveAndResetTracking()
      );
      const again = trackingReducer(
        started,
        TrackingActions.saveAndResetTracking()
      );

      expect(once.sessions[0].id).toBe('a@2026-06-01T09:00:00');
      expect(again).toEqual(once);
    });
  });

  it('merges the demo sessions the action carries, sorted by start time', () => {
    const next = trackingReducer(
      {
        ...initialState,
        sessions: [track({ id: 'old', startTime: '2026-06-03T09:00:00' })],
      },
      TrackingActions.seedDemoSessions([
        track({ id: 'later', startTime: '2026-06-02T09:00:00' }),
        track({ id: 'earlier', startTime: '2026-06-01T09:00:00' }),
      ])
    );

    expect(next.sessions.map((session) => session.id)).toEqual([
      'earlier',
      'later',
      'old',
    ]);
  });

  it('changes the data view', () => {
    const view = trackingReducer(
      initialState,
      TrackingActions.changeDataView('monthly')
    );
    expect(view.sessionsViewId).toBe('monthly');
  });

  // A stats row is a bucket of merged sessions, so deleting it has to take all
  // of them — keying the delete off the row's own id deleted exactly one.
  it('removes every session an aggregated data item lists', () => {
    const withData = {
      ...initialState,
      sessions: [track({ id: 'd1' }), track({ id: 'd2' }), track({ id: 'd3' })],
    };
    const removed = trackingReducer(
      withData,
      TrackingActions.removeDataItem({
        id: '20260601Task',
        name: 'Task',
        sessionIds: ['d1', 'd3'],
      })
    );
    expect(removed.sessions.map((index) => index.id)).toEqual(['d2']);
  });

  it('sets the sort descriptor', () => {
    const next = trackingReducer(
      initialState,
      TrackingActions.updateSort('name', 'asc')
    );
    expect(next.sort).toEqual({ sortBy: 'name', sortDirection: 'asc' });
  });

  it('hydrates from the datastore and forces the today view', () => {
    const next = trackingReducer(
      initialState,
      TrackingActions.loaded({
        items: [track({ id: 'a' })],
        sessions: [],
        sessionsViewId: 'all',
        searchQuery: 'stale',
      } as never)
    );
    expect(next.items.map((index) => index.id)).toEqual(['a']);
    expect(next.sessionsViewId).toBe('today');
    expect(next.searchQuery).toBeUndefined();
  });

  it('keeps the archived sessions the stored doc carries', () => {
    const next = trackingReducer(
      initialState,
      TrackingActions.loaded({
        items: [],
        sessions: [track({ id: 'archived' })],
      } as never)
    );
    expect(next.sessions.map((session) => session.id)).toEqual(['archived']);
  });
});
