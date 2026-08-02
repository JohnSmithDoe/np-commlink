import { Dayjs } from 'dayjs';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { Marker } from '../../@shared/model/app.types';

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

type DashboardSettings = {
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

export const DASHBOARD_SETTING_LABEL_KEYS: Record<
  DashboardSettingsType,
  Marker
> = {
  showDateCard: marker('office-time.page.settings.dashboard.showDateCard'),
  showPercentageCard: marker(
    'office-time.page.settings.dashboard.showPercentageCard'
  ),
  showOfficedaysCardList: marker(
    'office-time.page.settings.dashboard.showOfficedaysCardList'
  ),
  showOfficedaysCardEdit: marker(
    'office-time.page.settings.dashboard.showOfficedaysCardEdit'
  ),
  showFreedaysCardList: marker(
    'office-time.page.settings.dashboard.showFreedaysCardList'
  ),
  showFreedaysCardEdit: marker(
    'office-time.page.settings.dashboard.showFreedaysCardEdit'
  ),
  showHolidaysCard: marker(
    'office-time.page.settings.dashboard.showHolidaysCard'
  ),
  showStatsWeek: marker('office-time.page.settings.dashboard.showStatsWeek'),
  showStatsMonth: marker('office-time.page.settings.dashboard.showStatsMonth'),
  showStatsQuarter: marker(
    'office-time.page.settings.dashboard.showStatsQuarter'
  ),
  showStatsYear: marker('office-time.page.settings.dashboard.showStatsYear'),
  showWordclockCard: marker(
    'office-time.page.settings.dashboard.showWordclockCard'
  ),
};

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

type DashboardItemType = keyof typeof DASHBOARD_CARD_VISIBILITY;

export type DateTimeHighlight = {
  date: string;
  backgroundColor: string;
  border: string;
  textColor: string;
};

export interface OfficeTimeState {
  targetOfficeDaysPerWeek: number;
  holidays: Record<string, Dayjs>;
  officedays: Array<Dayjs>;
  freedays: Array<Dayjs>;
  dashboardSettings: DashboardSettings;
  dashboardItems: DashboardItemType[];
}

export type OfficeTimeStateStorage = Omit<
  OfficeTimeState,
  'holidays' | 'officedays' | 'freedays'
> & {
  holidays?: Record<string, string>;
  officedays?: Array<string>;
  freedays?: Array<string>;
};
