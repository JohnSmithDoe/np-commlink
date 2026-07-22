import { IOfficeTimeSettingsState, IOfficeTimeState } from '../model';

// Deterministic office-time fixtures. Owned by the office-time context (DDD
// review #1): they live here, not in the shared @shared/testing kit, because
// that kit is domain:shared and may not reference domain:office-time types.
export function mockOfficeTimeSettingsState(
  overrides: Partial<IOfficeTimeSettingsState> = {}
): IOfficeTimeSettingsState {
  return { showTotalTime: false, ...overrides };
}

export function mockOfficeTimeState(
  overrides: Partial<IOfficeTimeState> = {}
): IOfficeTimeState {
  return {
    targetOfficeDaysPerWeek: 3,
    holidays: {},
    officedays: [],
    freedays: [],
    dashboardSettings: {
      showDateCard: false,
      showPercentageCard: false,
      showOfficedaysCardList: false,
      showOfficedaysCardEdit: false,
      showFreedaysCardList: false,
      showFreedaysCardEdit: false,
      showHolidaysCard: false,
      showStatsWeek: false,
      showStatsMonth: false,
      showStatsQuarter: false,
      showStatsYear: false,
      showWordclockCard: false,
    },
    dashboardItems: [],
    ...overrides,
  };
}
