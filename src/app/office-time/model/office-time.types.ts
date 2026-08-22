/* ─── why ─────────────────────────────────────────────────────────
 * Keyed BY the day rather than lists of it, so a duplicate date cannot be
 * written down. It replaced a `hasDay` guard that held only where someone
 * remembered it, and never covered the whole-array picker writes.
 *
 * `true` is the whole value because the KEY is the date — the `Dayjs` is
 * reconstructible, and storing it would be a second writer for one fact.
 * It also keeps the shape from colliding with `HolidayMap`, keyed by
 * NAME: same container, different value, so a swap is a type error.
 *
 * A bare `string` is not assignable to `DayKey`, so every write — reads
 * back off IndexedDB included — goes through `dayjsToString`, which holds
 * the one cast. `OfficeTimeStateStorage` stays `string[]` on purpose:
 * no migration ladder, and an old document dedupes on read for free.
 * ───────────────────────────────────────────────────────────────── */
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

export type OfficeReminder = {
  enabled: boolean;
  hour: number;
  minute: number;
};

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

export type DayKey = `${number}-${number}-${number}`;

export type DayMap = Record<DayKey, true>;

export type HolidayMap = Record<string, Dayjs>;

export interface OfficeTimeState {
  targetOfficeDaysPerWeek: number;
  holidays: HolidayMap;
  officedays: DayMap;
  freedays: DayMap;
  dashboardSettings: DashboardSettings;
  dashboardItems: DashboardItemType[];
  reminder: OfficeReminder;
}

export type OfficeTimeStateStorage = Omit<
  OfficeTimeState,
  'holidays' | 'officedays' | 'freedays'
> & {
  holidays?: Record<string, string>;
  officedays?: Array<string>;
  freedays?: Array<string>;
};
