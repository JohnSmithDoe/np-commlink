import dayjs, { Dayjs } from 'dayjs';
import { DashboardStats, DateTimeHighlight } from '../../../@shared/types';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';

dayjs.extend(quarterOfYear);

type TimePeriod = 'year' | 'quarter' | 'month' | 'week';

export interface StatsInputs {
  officedays: Dayjs[];
  freedays: Dayjs[];
  holidays: Record<string, Dayjs>;
  targetOfficeDaysPerWeek: number;
}

const WORKDAYS_PER_WEEK = 5;

export const getWorkdays = (
  type: TimePeriod,
  holidays: Dayjs[],
  freedays: Dayjs[]
) => {
  const start = dayjs().startOf(type);
  const end = start.endOf(type);
  return daysBetween(
    start,
    end,
    (current) => !isHolidayOrFreeday(current, holidays, freedays)
  );
};

export const getOfficedays = (type: TimePeriod, officedays: Dayjs[]) => {
  const start = dayjs().startOf(type);
  const end = start.endOf(type);
  return daysBetween(start, end, (current) => isOfficeDay(current, officedays));
};
export const getFreedays = (type: TimePeriod, freedays: Dayjs[]) => {
  const start = dayjs().startOf(type);
  const end = start.endOf(type);
  return daysBetween(start, end, (current) => isFreeday(current, freedays));
};

export const getHolidays = (
  type: TimePeriod,
  holidays: Record<string, Dayjs>
) => {
  const holidayDays = Object.values(holidays);
  const start = dayjs().startOf(type);
  const end = start.endOf(type);
  return daysBetween(start, end, (current) => isHoliday(current, holidayDays));
};

export const getHolidaysNotOnWeekend = (
  type: TimePeriod,
  holidays: Record<string, Dayjs>
) => {
  const holidayDays = Object.values(holidays);
  const start = dayjs().startOf(type);
  const end = start.endOf(type);
  return daysBetween(
    start,
    end,
    (current) => !isWeekend(current) && isHoliday(current, holidayDays)
  );
};

export const getRemainingWorkdays = (
  unit: TimePeriod,
  holidays: Dayjs[],
  freedays: Dayjs[]
) => {
  const start = dayjs().startOf('day');
  const end = start.endOf(unit);
  return daysBetween(
    start,
    end,
    (current) => !isHolidayOrFreeday(current, holidays, freedays)
  );
};
const getTargetdaysRaw = (workdays: number, daysPerWeek: number) => {
  return (workdays * daysPerWeek) / WORKDAYS_PER_WEEK;
};

const getTargetdays = (workdays: number, daysPerWeek: number) => {
  return Math.round(getTargetdaysRaw(workdays, daysPerWeek) * 2) / 2;
};

const allDaysBetween = (start: Dayjs, end: Dayjs) => {
  const days: Dayjs[] = [];
  let current = start;
  while (current.isBefore(end) || current.isSame(end)) {
    days.push(current.clone());
    current = current.add(1, 'day');
  }
  return days;
};

const daysBetween = (
  start: Dayjs,
  end: Dayjs,
  condition: (current: Dayjs) => boolean
) => {
  const days = allDaysBetween(start, end);
  return days.filter(
    (current) =>
      (current.isAfter(start, 'day') || current.isSame(start, 'day')) &&
      (current.isBefore(end, 'day') || current.isSame(end, 'day')) &&
      condition(current)
  );
};

export const isFreeday = (current: Dayjs, freedays: Dayjs[]) => {
  return freedays.some((freeday) => freeday.isSame(current, 'day'));
};

export const isHoliday = (current: Dayjs, holidays: Dayjs[]) => {
  return holidays.some((holiday) => holiday.isSame(current, 'day'));
};

export const isHolidayOrFreeday = (
  current: Dayjs,
  holidays: Dayjs[],
  freedays: Dayjs[]
) => {
  return (
    isWeekend(current) ||
    isFreeday(current, freedays) ||
    isHoliday(current, holidays)
  );
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
  const targetDays = getTargetdaysRaw(workDays, daysPerWeek);
  return Math.trunc((officeDays / targetDays) * 100);
};

export const calculateStats = (
  period: TimePeriod,
  inputs: StatsInputs
): DashboardStats => {
  const officedays = getOfficedays(period, inputs.officedays);
  const freedays = getFreedays(period, inputs.freedays);
  const holidays = getHolidays(period, inputs.holidays);
  const holidaysNotOnWeekend = getHolidaysNotOnWeekend(period, inputs.holidays);
  const workdaysTotal = getWorkdays(period, [], []);
  const workdays = getWorkdays(period, holidays, freedays);
  const remaining = getRemainingWorkdays(period, holidays, freedays);
  const targetdays = getTargetdays(
    workdays.length,
    inputs.targetOfficeDaysPerWeek
  );
  return {
    percentage: getTargetPercentage(
      workdays.length,
      officedays.length,
      inputs.targetOfficeDaysPerWeek
    ),
    officedays: officedays.length,
    targetdays,
    workdays: workdays.length,
    workdaysTotal: workdaysTotal.length,
    remaining: remaining.length,
    freedays: freedays.length,
    holidays: holidays.length,
    holidaysNotOnWeekend: holidaysNotOnWeekend.length,
  };
};

export const rotateBase64 = async (dataUrl?: string, deg = 90) => {
  if (!dataUrl) return;
  const img = new Image();
  img.crossOrigin = 'anonymous';
  await new Promise((res, rej) => {
    img.onload = res;
    img.onerror = rej;
    img.src = dataUrl.startsWith('data:')
      ? dataUrl
      : `data:image/*;base64,${dataUrl}`;
  });

  const radians = ((deg % 360) * Math.PI) / 180;
  const sin = Math.abs(Math.sin(radians));
  const cos = Math.abs(Math.cos(radians));

  const w = img.naturalWidth;
  const h = img.naturalHeight;

  // canvas size of rotated bounding box
  const cw = Math.round(w * cos + h * sin);
  const ch = Math.round(w * sin + h * cos);

  const canvas = document.createElement('canvas');
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext('2d');

  // move to center, rotate, draw centered
  ctx?.translate(cw / 2, ch / 2);
  ctx?.rotate(radians);
  ctx?.drawImage(img, -w / 2, -h / 2);

  // export (match your source mime if needed)
  return canvas.toDataURL('image/*');
};

// Calendar days are stored as YYYY-MM-DD (no time, no zone) so that values
// roundtrip cleanly across timezones and DST boundaries. Parsing re-anchors
// at local noon to keep downstream `isSame(..., 'day')` and HH:mm formatting
// well-behaved. Legacy values written as full ISO strings still parse because
// dayjs is lenient with the input format.
const DAY_FORMAT = 'YYYY-MM-DD';
export const dayjsToString = (day: Dayjs) => day.format(DAY_FORMAT);
export const dayjsFromString = (date: string): Dayjs | null => {
  const parsed = dayjs(date).hour(12);
  return parsed.isValid() ? parsed : null;
};
export const dayjsToday = () => dayjs().hour(12);

export const deserializeIsoStringMap = (
  isoStringMap?: Record<string, string>
): Record<string, Dayjs> =>
  Object.entries(isoStringMap ?? {}).reduce(
    (acc, [name, isoString]) => {
      if (typeof isoString !== 'string') return acc;
      const parsed = dayjsFromString(isoString);
      if (parsed) acc[name] = parsed;
      return acc;
    },
    {} as Record<string, Dayjs>
  );

export const deserializeIsoStrings = (isoStrings?: string[]): Dayjs[] =>
  (isoStrings ?? [])
    .filter((day): day is string => typeof day === 'string')
    .map((day) => dayjsFromString(day))
    .filter((day): day is Dayjs => day !== null);

export const serializeDateMap = (dateMap?: Record<string, Dayjs>) =>
  Object.entries(dateMap ?? {}).reduce(
    (acc, [name, date]) => {
      acc[name] = dayjsToString(date);
      return acc;
    },
    {} as Record<string, string>
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
    .map(dayjsFromString)
    .filter((day): day is Dayjs => day !== null)
    .filter((day) => !holidayDays.some((holiday) => holiday.isSame(day)));
};

export const daysToHolidaysHighlightsInputTransform = (
  days?: Dayjs[] | null
): DateTimeHighlight[] =>
  (days ?? []).map((day) => ({
    date: day.format('YYYY-MM-DD'),
    textColor: '#fff',
    backgroundColor: 'rgba(147,150,162,0.33)',
    border: '2px solid #8f6d11',
  }));
export const daysToFreedaysHighlightsInputTransform = (
  days?: Dayjs[] | null
): DateTimeHighlight[] =>
  (days ?? []).map((day) => ({
    date: day.format('YYYY-MM-DD'),
    textColor: '#fff',
    backgroundColor: 'rgba(147,150,162,0.33)',
    border: '1px solid #4d5061',
  }));
