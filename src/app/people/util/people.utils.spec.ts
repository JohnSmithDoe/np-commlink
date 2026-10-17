import { createAddress } from './people.factory';
import { addressLines, ageOn, isBlankAddress } from './people.utils';

describe('ageOn', () => {
  it('counts a year only once the birthday has passed', () => {
    expect(ageOn('2000-10-11', '2026-10-10')).toBe(25);
    expect(ageOn('2000-10-10', '2026-10-10')).toBe(26);
  });

  it('ages a 29 February birthday on 28 February in a year without one', () => {
    expect(ageOn('2000-02-29', '2026-02-27')).toBe(25);
    expect(ageOn('2000-02-29', '2026-02-28')).toBe(26);
    expect(ageOn('2000-02-29', '2028-02-28')).toBe(27);
    expect(ageOn('2000-02-29', '2028-02-29')).toBe(28);
  });

  it('turns over on a birthday at the end of the year, not at New Year', () => {
    expect(ageOn('2000-12-31', '2026-12-30')).toBe(25);
    expect(ageOn('2000-12-31', '2026-12-31')).toBe(26);
    expect(ageOn('2001-01-01', '2026-12-31')).toBe(25);
    expect(ageOn('2001-01-01', '2027-01-01')).toBe(26);
  });
});

describe('addresses', () => {
  it('reads a whitespace-only address as blank', () => {
    expect(isBlankAddress({ ...createAddress(), city: '  ' })).toBe(true);
  });

  it('joins postal code and city on one line and skips empty lines', () => {
    expect(
      addressLines({
        street: 'Hauptstr. 1',
        postalCode: '12345',
        city: 'Musterstadt',
        country: '',
      })
    ).toEqual(['Hauptstr. 1', '12345 Musterstadt']);
  });
});
