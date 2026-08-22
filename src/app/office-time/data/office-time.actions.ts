import { createActionGroup, emptyProps } from '@ngrx/store';
import { Dayjs } from 'dayjs';
import {
  DashboardSettingsType,
  HolidayMap,
  OfficeReminder,
  OfficeTimeStateStorage,
} from '../model/office-time.types';

export const OfficeTimeActions = createActionGroup({
  source: 'OfficeTime',
  events: {
    load: emptyProps(),
    loaded: (officeTime: OfficeTimeStateStorage | null) => ({ officeTime }),

    loadHolidays: emptyProps(),
    loadHolidaysSuccess: (holidays: HolidayMap) => ({
      holidays,
    }),
    saveOfficeTime: emptyProps(),
    saveTargetOfficeDaysPerWeek: (daysPerWeek: number) => ({
      daysPerWeek,
    }),
    addOfficeTime: (today: Dayjs) => ({ today }),
    setOfficedays: (officedays: string[]) => ({ officedays }),
    addFreeday: (freeday: Dayjs) => ({ freeday }),
    setFreedays: (freedays: string[]) => ({ freedays }),
    saveDashboardSettings: (key: DashboardSettingsType, active: boolean) => ({
      key,
      active,
    }),
    setReminder: (reminder: OfficeReminder) => ({ reminder }),
    resetData: emptyProps(),
  },
});
