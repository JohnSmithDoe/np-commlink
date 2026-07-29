import { createActionGroup, emptyProps } from '@ngrx/store';
import { Dayjs } from 'dayjs';
import {
  DashboardSettingsType,
  IOfficeTimeStateStorage,
} from '../../model/office-time.types';

export const OfficeTimeActions = createActionGroup({
  source: 'OfficeTime',
  events: {
    // Own-data lazy load lifecycle. Payload is the persisted (ISO-string)
    // shape; the reducer deserializes it.
    load: emptyProps(),
    loaded: (officeTime: IOfficeTimeStateStorage | null) => ({ officeTime }),

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
