import { OfficeTimeState } from '../model/office-time.types';

export function mockOfficeTimeState(
  overrides: Partial<OfficeTimeState> = {}
): OfficeTimeState {
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
