import { createAddress } from './people.factory';
import { addressLines, ageOn, isBlankAddress } from './people.utils';

describe('ageOn', () => {
  it('counts a year only once the birthday has passed', () => {
    expect(ageOn('2000-10-11', '2026-10-10')).toBe(25);
    expect(ageOn('2000-10-10', '2026-10-10')).toBe(26);
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
