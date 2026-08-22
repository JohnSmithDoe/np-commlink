import { Dayjs } from 'dayjs';
import { DayMap, OfficeTimeState } from '../model/office-time.types';
import { dayMapFrom, dayjsToString } from '../util/office-time.utils';

export const dayMap = (...days: Dayjs[]): DayMap =>
  dayMapFrom(days.map((day) => dayjsToString(day)));

export function mockOfficeTimeState(
  overrides: Partial<OfficeTimeState> = {}
): OfficeTimeState {
  return {
    targetOfficeDaysPerWeek: 3,
    holidays: {},
    officedays: {},
    freedays: {},
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
    reminder: { enabled: false, hour: 9, minute: 0 },
    ...overrides,
  };
}
