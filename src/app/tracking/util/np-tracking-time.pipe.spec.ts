import { IDataItem } from '../model';
import { NpTrackingTimePipe } from './np-tracking-time.pipe';

const dataItem = (trackedTimeInSeconds?: number): IDataItem => ({
  id: '1',
  name: 'task',
  trackedTimeInSeconds,
});

describe('NpTrackingTimePipe', () => {
  const pipe = new NpTrackingTimePipe();

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
