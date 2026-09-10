import { IsoWeekday } from './app.types';

const PERIOD_UNITS = ['week', 'month', 'year'] as const;

export type PeriodUnit = (typeof PERIOD_UNITS)[number];

export type Interval =
  | { unit: 'day'; weekdays: readonly IsoWeekday[] }
  | { unit: PeriodUnit; every: number };

export type IntervalUnit = Interval['unit'];

export const INTERVAL_UNITS = ['day', ...PERIOD_UNITS] as const;
