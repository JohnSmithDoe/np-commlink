import dayjs, { Dayjs } from 'dayjs';
import {
  DashboardStats,
  DateTimeHighlight,
  DayKey,
  DayMap,
  HolidayMap,
} from '../model/office-time.types';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';

dayjs.extend(quarterOfYear);

export type TimePeriod = 'year' | 'quarter' | 'month' | 'week';

interface StatsInputs {
  officedays: DayMap;
  freedays: DayMap;
  holidays: HolidayMap;
  targetOfficeDaysPerWeek: number;
}

const WORKDAYS_PER_WEEK = 5;

const exactTargetDays = (workdays: number, daysPerWeek: number) =>
  (workdays * daysPerWeek) / WORKDAYS_PER_WEEK;

const roundedTargetDays = (workdays: number, daysPerWeek: number) =>
  Math.round(exactTargetDays(workdays, daysPerWeek) * 2) / 2;

const allDaysBetween = (start: Dayjs, end: Dayjs) => {
  const days: Dayjs[] = [];
  let current = start;
  while (current.isBefore(end) || current.isSame(end)) {
    days.push(current);
    current = current.add(1, 'day');
  }
  return days;
};

export const isWeekend = (current: Dayjs) => {
  const day = current.day();
  const isSunday = day === 0;
  const isSaturday = day === 6;
  return isSunday || isSaturday;
};

export const isOfficeDay = (current: Dayjs, officedays?: DayMap) =>
  Object.hasOwn(officedays ?? {}, dayjsToString(current));

export const getTargetPercentage = (
  workDays: number,
  officeDays: number,
  daysPerWeek: number
) => {
  if (workDays <= 0 || daysPerWeek <= 0) return 100;
  const targetDays = exactTargetDays(workDays, daysPerWeek);
  return Math.trunc((officeDays / targetDays) * 100);
};

const holidayKeysOf = (holidays?: HolidayMap): Set<string> =>
  new Set(Object.values(holidays ?? {}));

interface StatsKeys {
  officeKeys: Set<string>;
  freeKeys: Set<string>;
  holidayKeys: Set<string>;
  targetOfficeDaysPerWeek: number;
}

export const statsKeysFrom = (inputs: StatsInputs): StatsKeys => {
  return {
    officeKeys: new Set(Object.keys(inputs.officedays ?? {})),
    freeKeys: new Set(Object.keys(inputs.freedays ?? {})),
    holidayKeys: holidayKeysOf(inputs.holidays),
    targetOfficeDaysPerWeek: inputs.targetOfficeDaysPerWeek,
  };
};

export const calculateStats = (
  period: TimePeriod,
  keys: StatsKeys,
  today: Dayjs
): DashboardStats => {
  const { officeKeys, freeKeys, holidayKeys, targetOfficeDaysPerWeek } = keys;

  const start = today.startOf(period);
  const todayKey = dayjsToString(today);

  let officedays = 0;
  let freedays = 0;
  let holidays = 0;
  let holidaysNotOnWeekend = 0;
  let workdaysTotal = 0;
  let workdays = 0;
  let remaining = 0;

  const daysInPeriod = allDaysBetween(start, start.endOf(period));
  for (const day of daysInPeriod) {
    const key = dayjsToString(day);
    const isWeekendDay = isWeekend(day);
    const isFree = freeKeys.has(key);
    const isHoliday = holidayKeys.has(key);

    if (officeKeys.has(key)) officedays++;
    if (isFree) freedays++;
    if (isHoliday) holidays++;
    if (isHoliday && !isWeekendDay) holidaysNotOnWeekend++;
    if (!isWeekendDay) workdaysTotal++;

    const isWorkday = !isWeekendDay && !isFree && !isHoliday;
    if (isWorkday) workdays++;
    if (isWorkday && key >= todayKey) remaining++;
  }

  return {
    percentage: getTargetPercentage(
      workdays,
      officedays,
      targetOfficeDaysPerWeek
    ),
    officedays,
    targetdays: roundedTargetDays(workdays, targetOfficeDaysPerWeek),
    workdays,
    workdaysTotal,
    remaining,
    freedays,
    holidays,
    holidaysNotOnWeekend,
  };
};

const DAY_FORMAT = 'YYYY-MM-DD';
export const dayjsToString = (day: Dayjs) => day.format(DAY_FORMAT) as DayKey;
export const dayjsFromString = (date: string): Dayjs | null => {
  const parsed = dayjs(date).hour(12);
  return parsed.isValid() ? parsed : null;
};
export const dayjsToday = () => dayjs().hour(12);

const dayKeyFrom = (date?: string | null): DayKey | null => {
  if (typeof date !== 'string') return null;
  const parsed = dayjsFromString(date);
  return parsed ? dayjsToString(parsed) : null;
};

export const areHolidaysStale = (
  holidays: HolidayMap | undefined | null,
  year: number
): boolean => {
  const sample = Object.values(holidays ?? {})[0];
  return !!sample && Number(sample.slice(0, 4)) !== year;
};

export const holidayMapFrom = (
  named?: Record<string, string> | null
): HolidayMap => {
  const holidays: HolidayMap = {};
  if (named != null) {
    for (const [name, date] of Object.entries(named)) {
      const key = dayKeyFrom(date);
      if (key) holidays[name] = key;
    }
  }
  return holidays;
};

export const dayMapFrom = (
  dates?: ReadonlyArray<string | undefined | null> | DayMap | null
): DayMap => {
  const days: DayMap = {};
  const candidates = Array.isArray(dates) ? dates : Object.keys(dates ?? {});
  for (const date of candidates) {
    const key = dayKeyFrom(date);
    if (key) days[key] = true;
  }
  return days;
};

export const dayKeysOf = (days?: DayMap): DayKey[] =>
  (Object.keys(days ?? {}) as DayKey[]).toSorted((a, b) => a.localeCompare(b));

export const daysFromKeys = (keys?: readonly string[] | null): Dayjs[] => {
  return (keys ?? [])
    .map((key) => dayjsFromString(key))
    .filter((day): day is Dayjs => day !== null);
};

export const withoutHolidays = (
  days: DayMap,
  holidays?: HolidayMap
): DayMap => {
  const holidayKeys = holidayKeysOf(holidays);
  return Object.fromEntries(
    dayKeysOf(days)
      .filter((key) => !holidayKeys.has(key))
      .map((key): [DayKey, true] => [key, true])
  );
};

export const datetimeValues = (
  value: string | string[] | null | undefined
): string[] => {
  return (Array.isArray(value) ? value : [value]).filter(
    (date): date is string => !!date
  );
};

const HOLIDAY_HIGHLIGHT_BORDER = '2px solid #8f6d11';
const FREEDAY_HIGHLIGHT_BORDER = '1px solid #4d5061';

const calendarHighlights = (
  dates: readonly string[],
  border: string
): DateTimeHighlight[] => {
  return dates.map((date) => {
    return {
      date,
      textColor: '#fff',
      backgroundColor: 'rgba(147,150,162,0.33)',
      border,
    };
  });
};

export const holidayHighlights = (
  keys?: readonly string[] | null
): DateTimeHighlight[] =>
  calendarHighlights(keys ?? [], HOLIDAY_HIGHLIGHT_BORDER);

export const freedayHighlights = (
  keys?: readonly string[] | null
): DateTimeHighlight[] =>
  calendarHighlights(keys ?? [], FREEDAY_HIGHLIGHT_BORDER);
