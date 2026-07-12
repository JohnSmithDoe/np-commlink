import { NpTimeFromSecondsPipe } from './np-time-from-seconds.pipe';

describe('NpTimeFromSecondsPipe', () => {
  const pipe = new NpTimeFromSecondsPipe();

  it('returns whole minutes for a positive value', () => {
    expect(pipe.transform(60)).toBe('1');
    expect(pipe.transform(3661)).toBe('61');
  });

  it('floors partial minutes down', () => {
    expect(pipe.transform(59)).toBe('0');
    expect(pipe.transform(119)).toBe('1');
  });

  it('clamps undefined and negative values to 0', () => {
    expect(pipe.transform()).toBe('0');
    expect(pipe.transform(-42)).toBe('0');
  });
});
