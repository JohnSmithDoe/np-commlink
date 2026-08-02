import dayjs, { Dayjs } from 'dayjs';

/* eslint-disable unicorn/prevent-abbreviations */
const easterSunday = (year: number): Dayjs => {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const dayOfYear = h + l - 7 * m + 114;
  return dayjs(
    new Date(year, Math.floor(dayOfYear / 31) - 1, (dayOfYear % 31) + 1)
  );
};
/* eslint-enable unicorn/prevent-abbreviations */

const fixedDay = (year: number, month: number, day: number): Dayjs =>
  dayjs(new Date(year, month - 1, day));

export const berlinHolidaysFor = (year: number): Record<string, Dayjs> => {
  const easter = easterSunday(year);
  const holidays: Record<string, Dayjs> = {
    Neujahr: fixedDay(year, 1, 1),
    Karfreitag: easter.subtract(2, 'day'),
    Ostermontag: easter.add(1, 'day'),
    'Tag der Arbeit': fixedDay(year, 5, 1),
    'Christi Himmelfahrt': easter.add(39, 'day'),
    Pfingstmontag: easter.add(50, 'day'),
    'Tag der Deutschen Einheit': fixedDay(year, 10, 3),
    '1. Weihnachtsfeiertag': fixedDay(year, 12, 25),
    '2. Weihnachtsfeiertag': fixedDay(year, 12, 26),
  };
  if (year >= 2019)
    holidays['Internationaler Frauentag'] = fixedDay(year, 3, 8);
  return holidays;
};
