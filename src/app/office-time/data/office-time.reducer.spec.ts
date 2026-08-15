import dayjs from 'dayjs';
import { OfficeTimeActions } from './office-time.actions';
import {
  OfficeTimeState,
  OfficeTimeStateStorage,
} from '../model/office-time.types';
import { initialOfficeTime, officeTimeReducer } from './office-time.reducer';

const persistedWithCards = (
  dashboardItems: OfficeTimeState['dashboardItems']
): OfficeTimeStateStorage => ({
  ...initialOfficeTime,
  holidays: {},
  officedays: [],
  freedays: [],
  dashboardItems,
});

describe('officeTimeReducer', () => {
  it('saves the target office days per week', () => {
    const state = officeTimeReducer(
      initialOfficeTime,
      OfficeTimeActions.saveTargetOfficeDaysPerWeek(3)
    );
    expect(state.targetOfficeDaysPerWeek).toBe(3);
  });

  it('toggles a single dashboard setting without touching the rest', () => {
    const state = officeTimeReducer(
      initialOfficeTime,
      OfficeTimeActions.saveDashboardSettings('showDateCard', false)
    );
    expect(state.dashboardSettings.showDateCard).toBe(false);
    expect(state.dashboardSettings.showWordclockCard).toBe(true);
  });

  it('does not add the same freeday twice', () => {
    const once = officeTimeReducer(
      initialOfficeTime,
      OfficeTimeActions.addFreeday(dayjs('2026-07-01'))
    );
    const twice = officeTimeReducer(
      once,
      OfficeTimeActions.addFreeday(dayjs('2026-07-01'))
    );
    expect(Object.keys(once.freedays)).toEqual(['2026-07-01']);
    expect(Object.keys(twice.freedays)).toEqual(['2026-07-01']);
  });

  it('does not add the same officeday twice', () => {
    const once = officeTimeReducer(
      initialOfficeTime,
      OfficeTimeActions.addOfficeTime(dayjs('2026-07-01'))
    );
    const twice = officeTimeReducer(
      once,
      OfficeTimeActions.addOfficeTime(dayjs('2026-07-01'))
    );
    expect(Object.keys(once.officedays)).toEqual(['2026-07-01']);
    expect(Object.keys(twice.officedays)).toEqual(['2026-07-01']);
  });

  it('collapses two spellings of one day the picker replaced wholesale', () => {
    const state = officeTimeReducer(
      initialOfficeTime,
      OfficeTimeActions.setOfficedays(['2026-07-01', '2026-07-01T18:00:00'])
    );
    expect(Object.keys(state.officedays)).toEqual(['2026-07-01']);
  });

  describe('loaded', () => {
    it('collapses a duplicate a build before the keyed shape had persisted', () => {
      const state = officeTimeReducer(
        initialOfficeTime,
        OfficeTimeActions.loaded({
          ...persistedWithCards(['date']),
          officedays: ['2026-07-01', '2026-07-01'],
        })
      );

      expect(Object.keys(state.officedays)).toEqual(['2026-07-01']);
    });

    it('appends cards added since the user last persisted, keeping their order', () => {
      const state = officeTimeReducer(
        initialOfficeTime,
        OfficeTimeActions.loaded(persistedWithCards(['holidays', 'date']))
      );

      expect(state.dashboardItems.slice(0, 2)).toEqual(['holidays', 'date']);
      expect(state.dashboardItems).toEqual(
        expect.arrayContaining(initialOfficeTime.dashboardItems)
      );
    });

    it('drops a card this build no longer ships', () => {
      const state = officeTimeReducer(
        initialOfficeTime,
        OfficeTimeActions.loaded(
          persistedWithCards(['date', 'retired-card' as never])
        )
      );

      expect(state.dashboardItems).not.toContain('retired-card');
    });
  });

  it('resets data while preserving holidays', () => {
    const dirty = {
      ...initialOfficeTime,
      targetOfficeDaysPerWeek: 5,
      holidays: { '2026-12-25': dayjs('2026-12-25') },
    };
    const state = officeTimeReducer(dirty, OfficeTimeActions.resetData());
    expect(state.targetOfficeDaysPerWeek).toBe(
      initialOfficeTime.targetOfficeDaysPerWeek
    );
    expect(state.holidays).toEqual(dirty.holidays);
  });
});
