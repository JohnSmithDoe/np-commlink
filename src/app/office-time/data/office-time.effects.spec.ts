import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action } from '@ngrx/store';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { firstValueFrom, Observable, of } from 'rxjs';
import { mockOfficeTimeState } from '../testing/office-time.test-data';
import { holidayMapFrom } from '../util/office-time.utils';
import { OfficeTimeActions } from './office-time.actions';
import { OfficeTimeEffects } from './office-time.effects';

describe('OfficeTimeEffects', () => {
  let actions$: Observable<Action>;
  let store: MockStore;

  const setup = (officeTime = mockOfficeTimeState()) => {
    TestBed.configureTestingModule({
      providers: [
        OfficeTimeEffects,
        provideMockActions(() => actions$),
        provideMockStore({ initialState: { officeTime } }),
      ],
    });
    store = TestBed.inject(MockStore);
    return TestBed.inject(OfficeTimeEffects);
  };

  const emittedOn = (
    visibility: DocumentVisibilityState,
    heldYear: string
  ): Action[] => {
    vi.useFakeTimers({ now: new Date('2027-01-02T09:00:00') });
    const effects = setup(
      mockOfficeTimeState({
        holidays: holidayMapFrom({ Neujahr: `${heldYear}-01-01` }),
      })
    );
    const emitted: Action[] = [];
    const subscription = effects.refreshOnYearRollover$.subscribe((action) => {
      emitted.push(action);
    });
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue(visibility);
    document.dispatchEvent(new Event('visibilitychange'));
    subscription.unsubscribe();
    return emitted;
  };

  afterEach(() => {
    store?.resetSelectors();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('loadHolidays$', () => {
    it('computes the current year‘s Berlin holidays instead of fetching them', async () => {
      const effects = setup();
      actions$ = of(OfficeTimeActions.loadHolidays());

      const emitted = (await firstValueFrom(
        effects.loadHolidays$
      )) as ReturnType<typeof OfficeTimeActions.loadHolidaysSuccess>;

      expect(emitted.type).toBe(OfficeTimeActions.loadHolidaysSuccess.type);
      expect(Object.keys(emitted.holidays)).toHaveLength(10);
      const today = new Date();
      expect(emitted.holidays['Neujahr']).toBe(`${today.getFullYear()}-01-01`);
    });
  });

  describe('refreshOnYearRollover$', () => {
    it('reloads the holidays when the app comes back in a new year', () => {
      expect(emittedOn('visible', '2026')).toEqual([
        OfficeTimeActions.loadHolidays(),
      ]);
    });

    it('keeps the holidays that already belong to the current year', () => {
      expect(emittedOn('visible', '2027')).toEqual([]);
    });

    it('waits while the page is hidden', () => {
      expect(emittedOn('hidden', '2026')).toEqual([]);
    });
  });
});
