import dayjs, { Dayjs } from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import 'dayjs/locale/de';
import 'dayjs/locale/en';
import { TLanguage } from '../../model/app.types';

// Everything dayjs needs in order to *display* a date lives here, in the module
// that displays them, because both halves fail silently otherwise: `format('L')`
// without the plugin returns the literal string `"L"`, and `dayjs.locale('de')`
// without the German pack keeps whatever locale was active. Neither is a type
// error, so importing this module is what makes them impossible.
dayjs.extend(localizedFormat);

/** Sets the global dayjs locale. The one writer is `LanguageService.apply()`. */
export const setDayjsLocale = (language: TLanguage): void => {
  dayjs.locale(language);
};

/**
 * A date in the active locale's own numeric shape — `27.07.2026` under German,
 * `07/27/2026` under English. The dayjs counterpart of Angular's `date:'short'`
 * pipe, for the places that format outside a template.
 */
export const localizedDate = (value: string | Dayjs): string =>
  dayjs(value).format('L');

/** The same date spelled out: `27. Juli 2026` / `July 27, 2026`. */
export const localizedLongDate = (value: string | Dayjs): string =>
  dayjs(value).format('LL');

/** Date plus time of day: `27.07.2026 14:30` / `07/27/2026 2:30 PM`. */
export const localizedDateTime = (value: string | Dayjs): string =>
  dayjs(value).format('L LT');

// dayjs ships no localized day+month token and the two shapes disagree on order
// as well as separator, so they are spelled out — a `Record<TLanguage, …>`, so a
// third language is a compile error here rather than a German axis in English.
const DAY_MONTH_FORMAT: Record<TLanguage, string> = {
  de: 'DD.MM.',
  en: 'MMM D',
};

/**
 * Day and month, for a chart axis whose whole range is one year. Takes the
 * language explicitly, like the money parsers do: a chart rebuilds its labels
 * from a signal, so the caller already has it.
 */
export const localizedDayMonth = (
  value: string | Dayjs,
  language: TLanguage
): string => dayjs(value).format(DAY_MONTH_FORMAT[language]);

/**
 * Month and year only — the coarsest bucket a date view groups by. dayjs ships
 * no localized token for it, so it is composed from the locale's own month name
 * rather than from a numeric order no locale agrees on (`MM.YYYY` vs `YYYY-MM`).
 */
export const localizedMonthYear = (value: string | Dayjs): string =>
  dayjs(value).format('MMMM YYYY');
