import dayjs, { Dayjs } from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import 'dayjs/locale/de';
import 'dayjs/locale/en';
import { Language } from '../../model/app.types';

dayjs.extend(localizedFormat);

export const setDayjsLocale = (language: Language): void => {
  dayjs.locale(language);
};

export const localizedDate = (value: string | Dayjs): string =>
  dayjs(value).format('L');

export const localizedLongDate = (value: string | Dayjs): string =>
  dayjs(value).format('LL');

export const localizedDateTime = (value: string | Dayjs): string =>
  dayjs(value).format('L LT');

const DAY_MONTH_FORMAT: Record<Language, string> = {
  de: 'DD.MM.',
  en: 'MMM D',
};

export const localizedDayMonth = (
  value: string | Dayjs,
  language: Language
): string => dayjs(value).format(DAY_MONTH_FORMAT[language]);

export const localizedMonthYear = (value: string | Dayjs): string =>
  dayjs(value).format('MMMM YYYY');
