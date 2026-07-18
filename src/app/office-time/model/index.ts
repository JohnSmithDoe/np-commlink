import { Dayjs } from 'dayjs';
import { marker } from '@colsen1991/ngx-translate-extract-marker';

// The `office-time` bounded context owns its model (DDD review #1 — the god
// `@shared/types` file is being split so each context holds its own types). This
// covers both co-registered slices of the context: `settings` (feature flags)
// and `officeTime` (tracked days + stats + the office dashboard config).

export interface ISettingsState {
  showTotalTime: boolean;
  version: string;
}

export type DashboardStats = {
  workdays: number;
  workdaysTotal: number;
  officedays: number;
  targetdays: number;
  freedays: number;
  holidays: number;
  holidaysNotOnWeekend: number;
  remaining: number;
  percentage: number;
};

marker('officetime.page.settings.dashboard.showDateCard');
marker('officetime.page.settings.dashboard.showPercentageCard');
marker('officetime.page.settings.dashboard.showOfficedaysCardList');
marker('officetime.page.settings.dashboard.showOfficedaysCardEdit');
marker('officetime.page.settings.dashboard.showFreedaysCardList');
marker('officetime.page.settings.dashboard.showFreedaysCardEdit');
marker('officetime.page.settings.dashboard.showHolidaysCard');
marker('officetime.page.settings.dashboard.showStatsWeek');
marker('officetime.page.settings.dashboard.showStatsMonth');
marker('officetime.page.settings.dashboard.showStatsQuarter');
marker('officetime.page.settings.dashboard.showStatsYear');
marker('officetime.page.settings.dashboard.showWordclockCard');

export type DashboardSettings = {
  showDateCard: boolean;
  showPercentageCard: boolean;
  showOfficedaysCardList: boolean;
  showOfficedaysCardEdit: boolean;
  showFreedaysCardList: boolean;
  showFreedaysCardEdit: boolean;
  showHolidaysCard: boolean;
  showStatsWeek: boolean;
  showStatsMonth: boolean;
  showStatsQuarter: boolean;
  showStatsYear: boolean;
  showWordclockCard: boolean;
};

export type DashboardSettingsType = keyof DashboardSettings;
const DASHBOARD_ITEMS = [
  'date',
  'button',
  'wordclock',
  'officedays-list',
  'officedays-edit',
  'freedays-list',
  'freedays-edit',
  'stats-year',
  'stats-quarter',
  'stats-month',
  'stats-week',
  'holidays',
] as const;
export type DashboardItemType = (typeof DASHBOARD_ITEMS)[number];

export type DateTimeHighlight = {
  date: string;
  backgroundColor: string;
  border: string;
  textColor: string;
};

export interface IOfficeTimeState {
  targetOfficeDaysPerWeek: number;
  holidays: Record<string, Dayjs>;
  officedays: Array<Dayjs>;
  freedays: Array<Dayjs>;
  dashboardSettings: DashboardSettings;
  dashboardItems: DashboardItemType[];
}

export type IOfficeTimeStateStorage = Omit<
  IOfficeTimeState,
  'holidays' | 'officedays' | 'freedays'
> & {
  holidays?: Record<string, string>;
  officedays?: Array<string>;
  freedays?: Array<string>;
};
