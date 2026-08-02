import dayjs, { Dayjs } from 'dayjs';
import { DashboardStats, DateTimeHighlight } from '../model/office-time.types';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';

dayjs.extend(quarterOfYear);

export type TimePeriod = 'year' | 'quarter' | 'month' | 'week';

interface StatsInputs {
  officedays: Dayjs[];
  freedays: Dayjs[];
  holidays: Record<string, Dayjs>;
  targetOfficeDaysPerWeek: number;
}

const WORKDAYS_PER_WEEK = 5;

const exactTargetDays = (workdays: number, daysPerWeek: number) => {
  return (workdays * daysPerWeek) / WORKDAYS_PER_WEEK;
};

const roundedTargetDays = (workdays: number, daysPerWeek: number) => {
  return Math.round(exactTargetDays(workdays, daysPerWeek) * 2) / 2;
};

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

export const isOfficeDay = (current: Dayjs, officeDays?: Array<Dayjs>) => {
  return (
    officeDays?.some((officeday) => officeday.isSame(current, 'day')) ?? false
  );
};

export const getTargetPercentage = (
  workDays: number,
  officeDays: number,
  daysPerWeek: number
) => {
  if (workDays <= 0 || daysPerWeek <= 0) return 100;
  const targetDays = exactTargetDays(workDays, daysPerWeek);
  return Math.trunc((officeDays / targetDays) * 100);
};

const dayKeys = (days: Dayjs[]): Set<string> =>
  new Set(days.map((day) => dayjsToString(day)));

interface StatsKeys {
  officeKeys: Set<string>;
  freeKeys: Set<string>;
  holidayKeys: Set<string>;
  targetOfficeDaysPerWeek: number;
}

export const statsKeysFrom = (inputs: StatsInputs): StatsKeys => ({
  officeKeys: dayKeys(inputs.officedays),
  freeKeys: dayKeys(inputs.freedays),
  holidayKeys: dayKeys(Object.values(inputs.holidays)),
  targetOfficeDaysPerWeek: inputs.targetOfficeDaysPerWeek,
});

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

  for (const day of allDaysBetween(start, start.endOf(period))) {
    const key = dayjsToString(day);
    const weekend = isWeekend(day);
    const free = freeKeys.has(key);
    const holiday = holidayKeys.has(key);

    if (officeKeys.has(key)) officedays++;
    if (free) freedays++;
    if (holiday) holidays++;
    if (holiday && !weekend) holidaysNotOnWeekend++;
    if (!weekend) workdaysTotal++;

    const workday = !weekend && !free && !holiday;
    if (workday) workdays++;
    if (workday && key >= todayKey) remaining++;
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
export const dayjsToString = (day: Dayjs) => day.format(DAY_FORMAT);
export const dayjsFromString = (date: string): Dayjs | null => {
  const parsed = dayjs(date).hour(12);
  return parsed.isValid() ? parsed : null;
};
export const dayjsToday = () => dayjs().hour(12);

export const deserializeIsoStringMap = (
  isoStringMap?: Record<string, string>
): Record<string, Dayjs> => {
  const result: Record<string, Dayjs> = {};
  for (const [name, isoString] of Object.entries(isoStringMap ?? {})) {
    if (typeof isoString !== 'string') continue;
    const parsed = dayjsFromString(isoString);
    if (parsed) result[name] = parsed;
  }
  return result;
};

export const deserializeIsoStrings = (isoStrings?: string[]): Dayjs[] =>
  (isoStrings ?? [])
    .filter((day): day is string => typeof day === 'string')
    .map((day) => dayjsFromString(day))
    .filter((day): day is Dayjs => day !== null);

export const serializeDateMap = (
  dateMap?: Record<string, Dayjs>
): Record<string, string> =>
  Object.fromEntries(
    Object.entries(dateMap ?? {}).map(([name, date]): [string, string] => [
      name,
      dayjsToString(date),
    ])
  );

export const serializeDates = (dates?: Dayjs[]) =>
  dates?.map((day) => dayjsToString(day));

export const validateFreedays = (
  freedays: (string | undefined | null)[],
  holidays: Record<string, Dayjs> | undefined
) => {
  const holidayDays = Object.values(holidays ?? {});
  return freedays
    .filter((date): date is string => !!date)
    .map((date) => dayjsFromString(date))
    .filter((day): day is Dayjs => day !== null)
    .filter(
      (day) => !holidayDays.some((holiday) => holiday.isSame(day, 'day'))
    );
};

const HOLIDAY_HIGHLIGHT_BORDER = '2px solid #8f6d11';
const FREEDAY_HIGHLIGHT_BORDER = '1px solid #4d5061';

const calendarHighlights = (
  days: Dayjs[] | null | undefined,
  border: string
): DateTimeHighlight[] =>
  (days ?? []).map((day) => ({
    date: day.format('YYYY-MM-DD'),
    textColor: '#fff',
    backgroundColor: 'rgba(147,150,162,0.33)',
    border,
  }));

export const holidayHighlights = (days?: Dayjs[] | null): DateTimeHighlight[] =>
  calendarHighlights(days, HOLIDAY_HIGHLIGHT_BORDER);

export const freedayHighlights = (days?: Dayjs[] | null): DateTimeHighlight[] =>
  calendarHighlights(days, FREEDAY_HIGHLIGHT_BORDER);
