import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';
import { officeTimeActions } from './office-time.actions';
import { initialOfficeTime, officeTimeReducer } from './office-time.reducer';

describe('officeTimeReducer', () => {
  it('saves the target office days per week', () => {
    const state = officeTimeReducer(
      initialOfficeTime,
      officeTimeActions.saveTargetOfficeDaysPerWeek(3)
    );
    expect(state.targetOfficeDaysPerWeek).toBe(3);
  });

  it('toggles a single dashboard setting without touching the rest', () => {
    const state = officeTimeReducer(
      initialOfficeTime,
      officeTimeActions.saveDashboardSettings('showDateCard', false)
    );
    expect(state.dashboardSettings.showDateCard).toBe(false);
    expect(state.dashboardSettings.showWordclockCard).toBe(true);
  });

  it('stores and clears the barcode', () => {
    const saved = officeTimeReducer(
      initialOfficeTime,
      officeTimeActions.saveBarcode('data:image/png;base64,AAA')
    );
    expect(saved.barcode).toBe('data:image/png;base64,AAA');

    const cleared = officeTimeReducer(saved, officeTimeActions.deleteBarcode());
    expect(cleared.barcode).toBeUndefined();
  });

  it('does not add the same freeday twice', () => {
    const once = officeTimeReducer(
      initialOfficeTime,
      officeTimeActions.addFreeday(dayjs('2026-07-01'))
    );
    const twice = officeTimeReducer(
      once,
      officeTimeActions.addFreeday(dayjs('2026-07-01'))
    );
    expect(once.freedays).toHaveLength(1);
    expect(twice.freedays).toHaveLength(1);
  });

  it('resets data while preserving holidays and barcode', () => {
    const dirty = {
      ...initialOfficeTime,
      targetOfficeDaysPerWeek: 5,
      barcode: 'keep-me',
      holidays: { '2026-12-25': dayjs('2026-12-25') },
    };
    const state = officeTimeReducer(dirty, officeTimeActions.resetData());
    expect(state.targetOfficeDaysPerWeek).toBe(
      initialOfficeTime.targetOfficeDaysPerWeek
    );
    expect(state.barcode).toBe('keep-me');
    expect(state.holidays).toEqual(dirty.holidays);
  });
});
