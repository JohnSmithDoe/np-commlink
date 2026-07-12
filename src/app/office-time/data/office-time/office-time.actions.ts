import { createActionGroup, emptyProps } from '@ngrx/store';
import { Dayjs } from 'dayjs';
import { DashboardSettingsType } from '../../../@shared/types';

export const OfficeTimeActions = createActionGroup({
  source: 'Office Time',
  events: {
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
    'Save Barcode': (base64Blob: string) => ({ base64Blob }),
    'Delete Barcode': emptyProps(),
    'Rotate Barcode': emptyProps(),
    'Rotate Barcode Success': (barcode: string) => ({
      barcode,
    }),
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
