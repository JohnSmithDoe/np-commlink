import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action } from '@ngrx/store';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import dayjs from 'dayjs';
import { firstValueFrom, Observable, of, toArray } from 'rxjs';
import { APP_VERSION } from '../../@shared/model/app.consts';
import { DatabaseService } from '../../@shared/util/persistence/database.service';
import { wrapVersioned } from '../../@shared/util/persistence/versioned';
import { mockOfficeTimeState } from '../testing/office-time.test-data';
import { OfficeTimeActions } from './office-time.actions';
import { OfficeTimeEffects } from './office-time.effects';

describe('OfficeTimeEffects', () => {
  let actions$: Observable<Action>;
  let database: { save: ReturnType<typeof vi.fn> };
  let store: MockStore;

  const setup = (officeTime = mockOfficeTimeState()) => {
    database = { save: vi.fn().mockResolvedValue(undefined) };
    TestBed.configureTestingModule({
      providers: [
        OfficeTimeEffects,
        provideMockActions(() => actions$),
        provideMockStore({ initialState: { officeTime } }),
        { provide: DatabaseService, useValue: database },
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
      expect(emitted.holidays['Neujahr'].format('YYYY-MM-DD')).toBe(
        `${new Date().getFullYear()}-01-01`
      );
    });

    it('has no failure path left that could clear the map', () => {
      expect(
        (OfficeTimeActions as Record<string, unknown>)['loadHolidaysFailure']
      ).toBeUndefined();
    });
  });

  describe('saveOfficeTime$', () => {
    it('serializes the dayjs date collections before writing', async () => {
      const day = dayjs('2026-03-08');
      const effects = setup(
        mockOfficeTimeState({
          holidays: { 'Internationaler Frauentag': day },
          officedays: [day],
          freedays: [day],
        })
      );
      actions$ = of(OfficeTimeActions.saveOfficeTime());

      await firstValueFrom(effects.saveOfficeTime$);

      expect(database.save).toHaveBeenCalledWith(
        'officeTime',
        wrapVersioned(APP_VERSION, {
          ...mockOfficeTimeState(),
          holidays: { 'Internationaler Frauentag': '2026-03-08' },
          officedays: ['2026-03-08'],
          freedays: ['2026-03-08'],
        })
      );
    });

    it('stays alive when the write rejects, so the next save can still land', async () => {
      const effects = setup();
      database.save.mockRejectedValue(new Error('quota exceeded'));
      actions$ = of(OfficeTimeActions.saveOfficeTime());

      expect(
        await firstValueFrom(effects.saveOfficeTime$.pipe(toArray()))
      ).toEqual([]);
    });
  });

  describe('saveOn$', () => {
    it('maps every mutating action onto one save', async () => {
      const effects = setup();
      actions$ = of(
        OfficeTimeActions.addOfficeTime(dayjs('2026-03-08')),
        OfficeTimeActions.resetData()
      );

      expect(await firstValueFrom(effects.saveOn$.pipe(toArray()))).toEqual([
        OfficeTimeActions.saveOfficeTime(),
        OfficeTimeActions.saveOfficeTime(),
      ]);
    });
  });
});
