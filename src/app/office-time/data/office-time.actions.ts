import { createActionGroup, emptyProps } from '@ngrx/store';
import { Dayjs } from 'dayjs';
import {
  DashboardSettingsType,
  OfficeTimeStateStorage,
} from '../model/office-time.types';

export const OfficeTimeActions = createActionGroup({
  source: 'OfficeTime',
  events: {
    load: emptyProps(),
    loaded: (officeTime: OfficeTimeStateStorage | null) => ({ officeTime }),

    loadHolidays: emptyProps(),
    loadHolidaysSuccess: (holidays: Record<string, Dayjs>) => ({
      holidays,
    }),
    saveOfficeTime: emptyProps(),
    saveTargetOfficeDaysPerWeek: (daysPerWeek: number) => ({
      daysPerWeek,
    }),
    addOfficeTime: (today: Dayjs) => ({ today }),
    setOfficedays: (officedays: Dayjs[]) => ({ officedays }),
    addFreeday: (freeday: Dayjs) => ({ freeday }),
    setFreedays: (freedays: (string | undefined | null)[]) => ({ freedays }),
    saveDashboardSettings: (key: DashboardSettingsType, active: boolean) => ({
      key,
      active,
    }),
    resetData: emptyProps(),
  },
});
