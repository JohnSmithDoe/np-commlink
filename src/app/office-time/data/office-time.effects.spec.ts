import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action } from '@ngrx/store';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { firstValueFrom, Observable, of } from 'rxjs';
import { mockOfficeTimeState } from '../testing/office-time.test-data';
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

  afterEach(() => store?.resetSelectors());

  describe('loadHolidays$', () => {
    it('computes the current year‘s Berlin holidays instead of fetching them', async () => {
      const effects = setup();
      actions$ = of(OfficeTimeActions.loadHolidays());

      const emitted = (await firstValueFrom(
        effects.loadHolidays$
      )) as ReturnType<typeof OfficeTimeActions.loadHolidaysSuccess>;

      expect(emitted.type).toBe(OfficeTimeActions.loadHolidaysSuccess.type);
      expect(Object.keys(emitted.holidays)).toHaveLength(10);
      expect(emitted.holidays['Neujahr']).toBe(
        `${new Date().getFullYear()}-01-01`
      );
    });

    it('has no failure path left that could clear the map', () => {
      expect(
        (OfficeTimeActions as Record<string, unknown>)['loadHolidaysFailure']
      ).toBeUndefined();
    });
  });
});
