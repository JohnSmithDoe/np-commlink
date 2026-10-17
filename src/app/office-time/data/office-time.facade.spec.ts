import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { mockKernelState } from '../../@shared/testing/test-data';
import { mockOfficeTimeState } from '../testing/office-time.test-data';
import { dayMapFrom } from '../util/office-time.utils';
import { OfficeTimeActions } from './office-time.actions';
import { OfficeTimeFacade } from './office-time.facade';

const officeTime = mockOfficeTimeState({
  officedays: dayMapFrom(['2026-11-01']),
});

const returnAfterMidnight = (visibility: DocumentVisibilityState): void => {
  vi.setSystemTime(new Date('2026-11-01T08:00:00'));
  vi.spyOn(document, 'visibilityState', 'get').mockReturnValue(visibility);
  document.dispatchEvent(new Event('visibilitychange'));
};

describe('OfficeTimeFacade', () => {
  let store: MockStore;

  const setup = (): OfficeTimeFacade => {
    vi.useFakeTimers({ now: new Date('2026-10-31T23:30:00') });
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideMockStore({
          initialState: mockKernelState({ officeTime }),
        }),
      ],
    });
    store = TestBed.inject(MockStore);
    return TestBed.inject(OfficeTimeFacade);
  };

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('moves today forward when the page comes back visible on a new day', () => {
    const facade = setup();
    expect(facade.todayIsOfficeDay()).toBe(false);
    expect(facade.statsMonth().officedays).toBe(0);

    returnAfterMidnight('visible');

    expect(facade.todayIsOfficeDay()).toBe(true);
    expect(facade.statsMonth().officedays).toBe(1);
  });

  it('keeps yesterday while the page stays hidden', () => {
    const facade = setup();

    returnAfterMidnight('hidden');

    expect(facade.todayIsOfficeDay()).toBe(false);
  });

  it('re-reads today and loads the holidays on init', () => {
    const facade = setup();
    const dispatch = vi.spyOn(store, 'dispatch');
    vi.setSystemTime(new Date('2026-11-01T08:00:00'));

    facade.initOfficeTime();

    expect(facade.todayIsOfficeDay()).toBe(true);
    expect(dispatch).toHaveBeenCalledWith(OfficeTimeActions.loadHolidays());
  });

  it('stamps an office day with the current day', () => {
    const facade = setup();
    const dispatch = vi.spyOn(store, 'dispatch');

    facade.addOfficeToday();

    const action = dispatch.mock.lastCall?.[0] as unknown as ReturnType<
      typeof OfficeTimeActions.addOfficeTime
    >;
    expect(action.type).toBe(OfficeTimeActions.addOfficeTime.type);
    expect(action.today.format('YYYY-MM-DD')).toBe('2026-10-31');
  });
});
