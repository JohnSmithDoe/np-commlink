import {
  formatKg,
  gramsToInput,
  inputToGrams,
  kgToGrams,
} from './weight.utils';

describe('inputToGrams', () => {
  it.each([
    ['78,4', 78_400],
    ['78.4', 78_400],
    ['78', 78_000],
    [' 4,3 kg ', 4300],
  ])('reads %s as %i grams', (raw, grams) => {
    expect(inputToGrams(raw)).toBe(grams);
  });

  it.each(['', '.', 'abc', '-3'])('refuses %s', (raw) => {
    expect(inputToGrams(raw)).toBeNull();
  });

  it('rounds to the 100 g the display can show', () => {
    expect(inputToGrams('78,44')).toBe(78_400);
    expect(inputToGrams('78,46')).toBe(78_500);
  });
});

describe('kgToGrams', () => {
  it('does not leave float dust behind', () => {
    expect(kgToGrams(78.4)).toBe(78_400);
  });
});

describe('formatKg', () => {
  it('always shows one decimal, in the language of the app', () => {
    expect(formatKg(78_000, 'de')).toBe('78,0');
    expect(formatKg(78_400, 'en')).toBe('78.4');
  });

  it('signs a delta only when asked', () => {
    expect(formatKg(300, 'de', true)).toBe('+0,3');
    expect(formatKg(-300, 'de', true)).toBe('-0,3');
    expect(formatKg(-300, 'de')).toBe('-0,3');
  });
});

describe('gramsToInput', () => {
  it('offers an empty field for a missing weight', () => {
    expect(gramsToInput(null)).toBe('');
  });
});
