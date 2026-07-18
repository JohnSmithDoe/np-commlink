import { createActionGroup, emptyProps } from '@ngrx/store';
import { Dayjs } from 'dayjs';
import { DashboardSettingsType, IOfficeTimeStateStorage } from '../../model';

export const OfficeTimeActions = createActionGroup({
  source: 'Office Time',
  events: {
    // Own-data lazy load lifecycle (lazy-modules plan §2). Payload is the
    // persisted (ISO-string) shape; the reducer deserializes it.
    load: emptyProps(),
    loaded: (officeTime: IOfficeTimeStateStorage | null) => ({ officeTime }),

    'Init Office Time': emptyProps(),
    'Load Holidays': emptyProps(),
    'Load Holidays Failure': emptyProps(),
    'Load Holidays Success': (holidays: Record<string, Dayjs>) => ({
      holidays,
    }),
    'Save Office Time': emptyProps(),
    'Save Office Time Success': emptyProps(),
    'Save Target Office Days Per Week': (daysPerWeek: number) => ({
      daysPerWeek,
    }),
    'Add Office Time': (today: Dayjs) => ({ today }),
    'Add Officeday': (officeday: Dayjs) => ({ officeday }),
    'Set Officedays': (officedays: Dayjs[]) => ({ officedays }),
    'Add Freeday': (freeday: Dayjs) => ({ freeday }),
    'Set Freedays': (freedays: (string | undefined | null)[]) => ({ freedays }),
    'Save Dashboard Settings': (
      key: DashboardSettingsType,
      active: boolean
    ) => ({
      key,
      active,
    }),
    'Reset Data': emptyProps(),
  },
});
