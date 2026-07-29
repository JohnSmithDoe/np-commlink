import { Dayjs } from 'dayjs';
import { marker } from '@colsen1991/ngx-translate-extract-marker';

// The `office-time` bounded context owns its model (DDD review #1 — the god
// `@shared/types` file is being split so each context holds its own types). It
// is a single slice — `officeTime` (tracked days + stats + the office dashboard
// config).

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

marker('office-time.page.settings.dashboard.showDateCard');
marker('office-time.page.settings.dashboard.showPercentageCard');
marker('office-time.page.settings.dashboard.showOfficedaysCardList');
marker('office-time.page.settings.dashboard.showOfficedaysCardEdit');
marker('office-time.page.settings.dashboard.showFreedaysCardList');
marker('office-time.page.settings.dashboard.showFreedaysCardEdit');
marker('office-time.page.settings.dashboard.showHolidaysCard');
marker('office-time.page.settings.dashboard.showStatsWeek');
marker('office-time.page.settings.dashboard.showStatsMonth');
marker('office-time.page.settings.dashboard.showStatsQuarter');
marker('office-time.page.settings.dashboard.showStatsYear');
marker('office-time.page.settings.dashboard.showWordclockCard');

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

/**
 * Every dashboard card, mapped to the settings flag that hides it — `button` maps
 * to none, because logging today is the page's reason to exist and is not
 * hideable. This object IS the card vocabulary (`DashboardItemType` is its
 * keys), so the two used to drift as a hand-kept list plus a switch in the page;
 * now a new card cannot be added without saying whether it is hideable.
 */
export const DASHBOARD_CARD_VISIBILITY = {
  date: 'showDateCard',
  button: null,
  wordclock: 'showWordclockCard',
  'officedays-list': 'showOfficedaysCardList',
  'officedays-edit': 'showOfficedaysCardEdit',
  'freedays-list': 'showFreedaysCardList',
  'freedays-edit': 'showFreedaysCardEdit',
  'stats-year': 'showStatsYear',
  'stats-quarter': 'showStatsQuarter',
  'stats-month': 'showStatsMonth',
  'stats-week': 'showStatsWeek',
  holidays: 'showHolidaysCard',
} as const satisfies Record<string, keyof DashboardSettings | null>;

export type DashboardItemType = keyof typeof DASHBOARD_CARD_VISIBILITY;

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
