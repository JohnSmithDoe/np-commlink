import dayjs from 'dayjs';
import { OfficeTimeActions } from '../actions/office-time.actions';
import { initialOfficeTime, officeTimeReducer } from './office-time.reducer';

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
