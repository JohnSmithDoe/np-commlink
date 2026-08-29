import dayjs, { Dayjs } from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import 'dayjs/locale/de';
import 'dayjs/locale/en';
import 'dayjs/locale/fr';
import { IsoWeekday, Language } from '../../model/app.types';

dayjs.extend(localizedFormat);

export const setDayjsLocale = (language: Language): void => {
  dayjs.locale(language);
};

const ISO_DAY_FORMAT = 'YYYY-MM-DD';

export const isoDay = (value: string | Dayjs): string =>
  dayjs(value).format(ISO_DAY_FORMAT);

export const todayISO = (): string => dayjs().format(ISO_DAY_FORMAT);

export const localizedDate = (value: string | Dayjs): string =>
  dayjs(value).format('L');

export const localizedLongDate = (value: string | Dayjs): string =>
  dayjs(value).format('LL');

export const localizedDateTime = (value: string | Dayjs): string =>
  dayjs(value).format('L LT');

const DAY_MONTH_FORMAT: Record<Language, string> = {
  de: 'DD.MM.',
  en: 'MMM D',
  fr: 'DD/MM',
};

export const localizedDayMonth = (
  value: string | Dayjs,
  language: Language
): string => dayjs(value).format(DAY_MONTH_FORMAT[language]);

export const localizedMonthYear = (value: string | Dayjs): string =>
  dayjs(value).format('MMMM YYYY');

export const localizedShortMonthYear = (value: string | Dayjs): string =>
  dayjs(value).format('MMM YY');

const DAYJS_DAY: Readonly<Record<IsoWeekday, number>> = {
  1: 1,
  2: 2,
  3: 3,
  4: 4,
  5: 5,
  6: 6,
  7: 0,
};

export const localizedWeekday = (
  day: IsoWeekday,
  style: 'short' | 'long'
): string =>
  dayjs()
    .day(DAYJS_DAY[day])
    .format(style === 'long' ? 'dddd' : 'dd');

export const padClock = (value: number): string =>
  String(value).padStart(2, '0');

export const clockTime = (hour: number, minute: number): string =>
  `${padClock(hour)}:${padClock(minute)}`;

export const parseClock = (
  value: unknown
): { hour: number; minute: number } | undefined => {
  if (typeof value !== 'string') return undefined;
  const [hour, minute] = value.split(':').map(Number);
  if (
    hour === undefined ||
    minute === undefined ||
    Number.isNaN(hour) ||
    Number.isNaN(minute)
  ) {
    return undefined;
  }
  return { hour, minute };
};
