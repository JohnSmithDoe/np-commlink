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
    loadHolidaysSuccess: (holidays: HolidayMap) => {
      return {
        holidays,
      };
    },
    saveTargetOfficeDaysPerWeek: (daysPerWeek: number) => {
      return {
        daysPerWeek,
      };
    },
    addOfficeTime: (today: Dayjs) => ({ today }),
    setOfficedays: (officedays: string[]) => ({ officedays }),
    addFreeday: (freeday: Dayjs) => ({ freeday }),
    setFreedays: (freedays: string[]) => ({ freedays }),
    saveDashboardSettings: (key: DashboardSettingsType, isActive: boolean) => {
      return {
        key,
        active: isActive,
      };
    },
    setReminder: (reminder: OfficeReminder) => ({ reminder }),
    resetData: emptyProps(),
  },
});
