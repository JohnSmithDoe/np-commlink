import { ITrackingItem } from '../../model/tracking.types';
import { TrackingActions } from '../actions/tracking.actions';
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

  it('archives started items into data and resets the list on saveAndReset', () => {
    const state = withItems([
      track({
        id: 'a',
        name: 'Started',
        state: 'paused',
        startTime: '2026-06-01T09:00:00',
        trackedTimeInSeconds: 100,
      }),
      track({ id: 'b', name: 'Untouched', state: 'stopped' }),
    ]);
    const next = trackingReducer(state, TrackingActions.saveAndResetTracking());

    expect(next.sessions).toHaveLength(1);
    expect(next.sessions[0].name).toBe('Started');
    expect(next.sessions[0].id).not.toBe('a'); // archived with a fresh id
    expect(
      next.items.every((index) => !index.startTime && index.state === 'stopped')
    ).toBe(true);
  });

  it('changes the data view and removes archived data items', () => {
    const view = trackingReducer(
      initialState,
      TrackingActions.changeDataView('monthly')
    );
    expect(view.sessionsViewId).toBe('monthly');

    const withData = {
      ...initialState,
      sessions: [track({ id: 'd1' }), track({ id: 'd2' })],
    };
    const removed = trackingReducer(
      withData,
      TrackingActions.removeDataItem({ id: 'd1', name: 'Task' })
    );
    expect(removed.sessions.map((index) => index.id)).toEqual(['d2']);
  });

  it('sets the sort descriptor', () => {
    const next = trackingReducer(
      initialState,
      TrackingActions.updateSort('name', 'asc')
    );
    expect(next.sort).toEqual({ sortBy: 'name', sortDir: 'asc' });
  });

  it('hydrates from the datastore and forces the today view', () => {
    const next = trackingReducer(
      initialState,
      TrackingActions.loaded({
        title: 'Time tracking',
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

  it('hydrates archived sessions persisted under the pre-rename `data` key', () => {
    const next = trackingReducer(
      initialState,
      TrackingActions.loaded({
        title: 'Time tracking',
        items: [],
        data: [track({ id: 'archived' })],
        dataViewId: 'all',
      } as never)
    );
    expect(next.sessions.map((session) => session.id)).toEqual(['archived']);
  });

  it('prefers the current `sessions` key when both are present', () => {
    const next = trackingReducer(
      initialState,
      TrackingActions.loaded({
        title: 'Time tracking',
        items: [],
        sessions: [track({ id: 'new' })],
        data: [track({ id: 'old' })],
      } as never)
    );
    expect(next.sessions.map((session) => session.id)).toEqual(['new']);
  });
});
