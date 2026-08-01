import { setDayjsLocale } from '../../@shared/util/formatting/date-format.utils';
import { IDataItem } from '../model/tracking.types';
import { TimeFromDataItemPipe } from './time-from-data-item.pipe';

const dataItem = (startTime?: string): IDataItem => ({
  id: '1',
  name: 'task',
  startTime,
  sessionIds: ['s1'],
});

describe('TimeFromDataItemPipe', () => {
  const pipe = new TimeFromDataItemPipe();
  const item = dataItem('2026-03-05T14:30:00');

  // The output follows the *global* dayjs locale, which leaks across spec files
  // (the runner does not isolate), so the locale these expectations are written
  // in has to be set here rather than inherited from whoever ran last.
  beforeEach(() => setDayjsLocale('de'));

  it('returns an empty string for the aggregated "all" view', () => {
    expect(pipe.transform(item, 'all')).toBe('');
  });

  it('returns an empty string when there is no valid start time', () => {
    expect(pipe.transform(dataItem(), 'daily')).toBe('');
    expect(pipe.transform(dataItem('not-a-date'), 'daily')).toBe('');
    expect(pipe.transform(undefined, 'daily')).toBe('');
  });

  // Without a view there is no bucket, so there is nothing to claim about the
  // date — it stays blank rather than guessing the finest granularity.
  it('returns an empty string when no view is given', () => {
    expect(pipe.transform(item)).toBe('');
  });

  it('formats the day for the daily and today views', () => {
    expect(pipe.transform(item, 'daily')).toBe('05.03.2026');
    expect(pipe.transform(item, 'today')).toBe('05.03.2026');
  });

  // Spelled out rather than numeric: no locale agrees on the order of a bare
  // month/year pair, so the month is named.
  it('formats the month for the monthly view', () => {
    expect(pipe.transform(item, 'monthly')).toBe('März 2026');
  });

  it('formats a full date-time for the raw view', () => {
    expect(pipe.transform(item, 'raw')).toBe('05.03.2026 14:30');
  });

  it('follows the active locale', () => {
    setDayjsLocale('en');
    expect(pipe.transform(item, 'daily')).toBe('03/05/2026');
  });
});
