import dayjs, { Dayjs } from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import 'dayjs/locale/de';
import 'dayjs/locale/en';
import { TLanguage } from '../model/app.types';

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
