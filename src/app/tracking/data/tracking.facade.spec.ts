import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import dayjs from 'dayjs';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { mockKernelState } from '../../@shared/testing/test-data';
import {
  mockTrackingItem,
  mockTrackingState,
} from '../testing/tracking.test-data';
import { TrackingActions } from './tracking.actions';
import { TrackingFacade } from './tracking.facade';
import { ItemDialogService } from '../../@shared/data/item-lists/item-dialog.service';

describe('TrackingFacade', () => {
  let store: MockStore;
  let facade: TrackingFacade;
  let dispatch: ReturnType<typeof vi.spyOn>;

  const archived = mockTrackingItem({
    id: 's1',
    startTime: '2026-06-01T09:00:00',
    trackedTimeInSeconds: 3600,
  });

  beforeEach(() => {
    const initialState = mockKernelState({
      tracking: mockTrackingState({
        sessions: [archived],
        sessionsViewId: 'all',
      }),
    });
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideMockStore({ initialState }),
      ],
    });
    store = TestBed.inject(MockStore);
    facade = TestBed.inject(TrackingFacade);
    dispatch = vi.spyOn(store, 'dispatch');
  });

  afterEach(() => vi.useRealTimers());

  it('reads the archive through the view the slice holds', () => {
    expect(facade.viewMode()).toBe('all');
    expect(facade.sessionsByView().map((row) => row.name)).toEqual([
      archived.name,
    ]);
    expect(facade.allSessions()).toHaveLength(1);
  });

  it('opens an archived session in the session dialog, a live one in the item dialog', () => {
    const dialogs = TestBed.inject(ItemDialogService);

    facade.showSessionDialog(archived);
    expect(dialogs.request()?.listId).toBe('_tracking-sessions');

    facade.showSessionDialog(mockTrackingItem({ id: 'live' }));
    expect(dialogs.request()?.listId).toBe('_tracking');
  });

  it('stamps the toggle with the moment it happened', () => {
    const moment = '2026-06-01T10:00:00';
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(moment));
    const item = mockTrackingItem({ id: 't1' });

    facade.toggleTracking(item);

    expect(dispatch).toHaveBeenCalledWith(
      TrackingActions.toggleTrackingItem(item, dayjs(moment).format())
    );
  });

  it('dispatches the reset, archive and export commands', () => {
    facade.resetItem(mockTrackingItem({ id: 't1' }));
    facade.resetAll();
    facade.saveAndReset();
    facade.shareCsv();
    facade.changeDataView('monthly');
    facade.applyNotificationCommand('tracking.start', 't1');

    const dispatchedTypes = (
      dispatch.mock.calls as Array<[{ type: string }]>
    ).map((call) => call[0].type);

    expect(dispatchedTypes).toEqual([
      TrackingActions.resetTracking(mockTrackingItem()).type,
      TrackingActions.resetAllTracking().type,
      TrackingActions.saveAndResetTracking().type,
      TrackingActions.shareData().type,
      TrackingActions.changeDataView('monthly').type,
      TrackingActions.applyNotificationCommand('tracking.start', 't1').type,
    ]);
  });

  it('deletes every session behind an aggregated stats row', () => {
    facade.removeDataItem({
      id: 'bucket',
      name: 'Ticket',
      sessionIds: ['s1', 's2'],
    });

    expect(dispatch).toHaveBeenCalledWith(
      TrackingActions.removeDataItem({
        id: 'bucket',
        name: 'Ticket',
        sessionIds: ['s1', 's2'],
      })
    );
  });

  it('generates the demo sessions before dispatching them', () => {
    facade.seedDemoSessions();

    const { sessions } = dispatch.mock.calls[0][0] as ReturnType<
      typeof TrackingActions.seedDemoSessions
    >;
    expect(sessions.length).toBeGreaterThan(0);
    expect(sessions.every((session) => !!session.startTime)).toBe(true);
  });
});
