import { IDataItem } from '../model/tracking.types';
import { TrackingTimePipe } from './tracking-time.pipe';

const dataItem = (trackedTimeInSeconds?: number): IDataItem => ({
  id: '1',
  name: 'task',
  trackedTimeInSeconds,
  sessionIds: ['s1'],
});

describe('TrackingTimePipe', () => {
  const pipe = new TrackingTimePipe();

  it('formats seconds as zero-padded HH:MM:SS', () => {
    expect(pipe.transform(dataItem(3661))).toBe('01:01:01');
    expect(pipe.transform(dataItem(45_296))).toBe('12:34:56');
  });

  it('returns 00:00:00 for a missing item or time', () => {
    expect(pipe.transform()).toBe('00:00:00');
    expect(pipe.transform(dataItem())).toBe('00:00:00');
  });

  it('clamps negative values to 00:00:00', () => {
    expect(pipe.transform(dataItem(-10))).toBe('00:00:00');
  });
});
