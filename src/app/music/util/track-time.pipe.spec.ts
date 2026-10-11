import { trackTime } from './track-time.pipe';

describe('trackTime', () => {
  it.each([
    [5041, '0:05'],
    [65_000, '1:05'],
    [3_725_000, '1:02:05'],
    [undefined, '–:––'],
  ])('formats %s ms as %s', (ms, expected) => {
    expect(trackTime(ms)).toBe(expected);
  });
});
