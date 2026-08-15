import { Dayjs } from 'dayjs';
import {
  localizedDate,
  localizedDateTime,
  localizedMonthYear,
  padClock,
} from '../../@shared/util/formatting/date-format.utils';
import { TrackingViewId } from '../model/tracking.types';

const VIEW_DATE_FORMATTERS: Record<
  TrackingViewId,
  ((value: string | Dayjs) => string) | undefined
> = {
  raw: localizedDateTime,
  today: localizedDate,
  daily: localizedDate,
  monthly: localizedMonthYear,
  all: undefined,
};

export const formatViewDate = (
  value: string | Dayjs | undefined,
  viewId: TrackingViewId
): string => {
  const format = VIEW_DATE_FORMATTERS[viewId];
  return value && format ? format(value) : '';
};

export const formatSecondsAsClock = (totalSeconds: number): string => {
  const safe = Math.max(0, Math.trunc(totalSeconds));
  const hh = Math.trunc(safe / 3600);
  const mm = Math.trunc((safe % 3600) / 60);
  const ss = safe % 60;
  return `${padClock(hh)}:${padClock(mm)}:${padClock(ss)}`;
};

const csvEscape = (value: unknown): string => {
  const s = value == undefined ? '' : String(value);
  return /[",\r\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
};

export const csvRow = (fields: unknown[]): string =>
  fields.map((field) => csvEscape(field)).join(',');
