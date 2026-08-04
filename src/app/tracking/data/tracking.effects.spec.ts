import { TestBed } from '@angular/core/testing';
import { ShareOptions } from '@capacitor/share';
import { ShareService } from '../../@shared/data/services/share.service';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action } from '@ngrx/store';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { TranslateService } from '@ngx-translate/core';
import dayjs from 'dayjs';
import {
  localizedDate,
  localizedDateTime,
  localizedMonthYear,
} from '../../@shared/util/formatting/date-format.utils';
import { firstValueFrom, Observable, of, Subject, Subscription } from 'rxjs';
import {
  mockKernelState,
  TEST_TIMESTAMP,
} from '../../@shared/testing/test-data';
import { TrackingItem, TrackingState } from '../model/tracking.types';
import {
  mockTrackingItem,
  mockTrackingState,
} from '../testing/tracking.test-data';
import { TrackingActions } from './tracking.actions';
import { TrackingEffects } from './tracking.effects';

const trackedSession = (
  name: string,
  trackedTimeInSeconds: number,
  id: string
) =>
  mockTrackingItem({
    id,
    name,
    startTime: TEST_TIMESTAMP,
    trackedTimeInSeconds,
  });

describe('TrackingEffects', () => {
  let actions$: Observable<Action>;
  let effects: TrackingEffects;
  let store: MockStore;

  const share = vi.fn(async (_options: ShareOptions) => ({}));

  const sharedCsvRows = (): string[] =>
    (share.mock.calls[0][0].text ?? '').split('\r\n');

  const listNowHolds = (items: TrackingItem[]) =>
    store.setState(mockKernelState({ tracking: mockTrackingState({ items }) }));

  const setup = (tracking: TrackingState = mockTrackingState()) => {
    TestBed.configureTestingModule({
      providers: [
        TrackingEffects,
        provideMockActions(() => actions$),
        provideMockStore({ initialState: mockKernelState({ tracking }) }),
        {
          provide: TranslateService,
          useValue: { instant: (key: string) => key },
        },
        { provide: ShareService, useValue: { share } },
      ],
    });
    store = TestBed.inject(MockStore);
    effects = TestBed.inject(TrackingEffects);
  };

  beforeEach(() => share.mockClear());

  describe('trackTime$', () => {
    const running = mockTrackingItem({
      id: 't1',
      state: 'running',
      startTime: TEST_TIMESTAMP,
    });
    const paused = mockTrackingItem({ id: 't1', state: 'paused' });

    let dispatched: Subject<Action>;
    let subscription: Subscription | undefined;

    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(TEST_TIMESTAMP));
      dispatched = new Subject<Action>();
      actions$ = dispatched;
    });

    afterEach(() => {
      subscription?.unsubscribe();
      vi.useRealTimers();
    });

    const collectTicks = (): Action[] => {
      const ticks: Action[] = [];
      subscription = effects.trackTime$.subscribe((tick) => ticks.push(tick));
      return ticks;
    };

    it('ticks an update for the running item immediately and then every second', () => {
      setup(mockTrackingState({ items: [running] }));
      const ticks = collectTicks();

      dispatched.next(
        TrackingActions.toggleTrackingItem(running, TEST_TIMESTAMP)
      );
      vi.advanceTimersByTime(2000);

      const tickAt = (offsetMs: number) =>
        TrackingActions.updateTracking(
          running,
          dayjs(TEST_TIMESTAMP).add(offsetMs, 'ms').format()
        );
      expect(ticks).toEqual([tickAt(0), tickAt(1000), tickAt(2000)]);
    });

    it('starts ticking on hydrate, without a toggle', () => {
      const hydrated = mockTrackingState({ items: [running] });
      setup(hydrated);
      const ticks = collectTicks();

      dispatched.next(TrackingActions.loaded(hydrated));
      vi.advanceTimersByTime(1000);

      expect(ticks).toHaveLength(2);
    });

    it('stops ticking the moment nothing runs any more, and stays down until the next toggle', () => {
      setup(mockTrackingState({ items: [running] }));
      const ticks = collectTicks();
      dispatched.next(
        TrackingActions.toggleTrackingItem(running, TEST_TIMESTAMP)
      );
      vi.advanceTimersByTime(1000);

      listNowHolds([paused]);
      vi.advanceTimersByTime(1000);
      expect(ticks).toHaveLength(2);

      listNowHolds([running]);
      vi.advanceTimersByTime(5000);
      expect(ticks).toHaveLength(2);
    });

    it('restarts the one interval per toggle instead of stacking a second one', () => {
      setup(mockTrackingState({ items: [running] }));
      const ticks = collectTicks();

      dispatched.next(
        TrackingActions.toggleTrackingItem(running, TEST_TIMESTAMP)
      );
      vi.advanceTimersByTime(1500);
      dispatched.next(
        TrackingActions.toggleTrackingItem(running, TEST_TIMESTAMP)
      );
      vi.advanceTimersByTime(1000);

      expect(ticks).toHaveLength(4);
    });
  });

  describe('shareData$', () => {
    it('exports a header plus one RFC-4180 escaped row per grouped session', async () => {
      setup(
        mockTrackingState({
          sessionsViewId: 'daily',
          sessions: [
            trackedSession('Ticket, urgent', 3661, 's1'),
            trackedSession('He said "hi"', 45, 's2'),
          ],
        })
      );
      actions$ = of(TrackingActions.shareData());

      await firstValueFrom(effects.shareData$);

      const day = localizedDate(TEST_TIMESTAMP);
      expect(sharedCsvRows()).toEqual([
        'csv.header.name,csv.header.start-time,csv.header.tracked-seconds,csv.header.tracked-clock',
        `"Ticket, urgent",${day},3661,01:01:01`,
        `"He said ""hi""",${day},45,00:00:45`,
      ]);
    });

    it('titles the sheet with the translated share keys', async () => {
      setup(mockTrackingState({ sessionsViewId: 'daily' }));
      actions$ = of(TrackingActions.shareData());

      await firstValueFrom(effects.shareData$);

      expect(share).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'share.csv.title',
          dialogTitle: 'share.csv.dialog',
        })
      );
    });

    it.each([
      ['monthly' as const, localizedMonthYear(TEST_TIMESTAMP)],
      ['raw' as const, localizedDateTime(TEST_TIMESTAMP)],
      ['daily' as const, localizedDate(TEST_TIMESTAMP)],
    ])(
      'stamps the %s view with its own start-time format',
      async (sessionsViewId, expected) => {
        setup(
          mockTrackingState({
            sessionsViewId,
            sessions: [trackedSession('Ticket', 3661, 's1')],
          })
        );
        actions$ = of(TrackingActions.shareData());

        await firstValueFrom(effects.shareData$);

        expect(sharedCsvRows()[1]).toBe(`Ticket,${expected},3661,01:01:01`);
      }
    );

    it('blanks the start-time column for the all-time view', async () => {
      setup(
        mockTrackingState({
          sessionsViewId: 'all',
          sessions: [trackedSession('Ticket', 3661, 's1')],
        })
      );
      actions$ = of(TrackingActions.shareData());

      await firstValueFrom(effects.shareData$);

      expect(sharedCsvRows()[1]).toBe('Ticket,,3661,01:01:01');
    });

    it('survives a dismissed sheet so the next export still reaches the plugin', async () => {
      const shares = new Subject<Action>();
      actions$ = shares;
      setup(mockTrackingState({ sessionsViewId: 'daily' }));
      const subscription = effects.shareData$.subscribe();
      share.mockRejectedValueOnce(new Error('share canceled'));

      shares.next(TrackingActions.shareData());
      await expect(share.mock.results[0].value).rejects.toThrow();
      shares.next(TrackingActions.shareData());

      expect(share).toHaveBeenCalledTimes(2);
      subscription.unsubscribe();
    });
  });
});
