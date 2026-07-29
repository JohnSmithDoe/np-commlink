import dayjs from 'dayjs';
import { OfficeTimeActions } from '../actions/office-time.actions';
import {
  IOfficeTimeState,
  IOfficeTimeStateStorage,
} from '../../model/office-time.types';
import { initialOfficeTime, officeTimeReducer } from './office-time.reducer';

const persistedWithCards = (
  dashboardItems: IOfficeTimeState['dashboardItems']
): IOfficeTimeStateStorage => ({
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
    expect(once.freedays).toHaveLength(1);
    expect(twice.freedays).toHaveLength(1);
  });

  describe('loaded', () => {
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

    // The page's visibility filter is total over the current card vocabulary, so
    // a card this build no longer ships must not survive hydration — it would
    // render an empty grid slot.
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
