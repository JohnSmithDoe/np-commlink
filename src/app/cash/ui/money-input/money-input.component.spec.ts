import { NOT_AN_AMOUNT, parseAmount } from './money-input.component';

describe('money-input parseAmount', () => {
  it('reads a de-DE amount as integer cents', () => {
    expect(parseAmount('12,34')).toEqual({ value: 1234 });
    expect(parseAmount('1.000')).toEqual({ value: 100_000 });
    expect(parseAmount('-25')).toEqual({ value: -2500 });
  });

  it('reads an empty box as null rather than as an error', () => {
    expect(parseAmount('')).toEqual({ value: null });
    expect(parseAmount(' \t ')).toEqual({ value: null });
  });

  it('reports junk without touching the model', () => {
    expect(parseAmount('abc')).toEqual({ error: NOT_AN_AMOUNT });
    expect(parseAmount('1,2,3')).toEqual({ error: NOT_AN_AMOUNT });
  });
});
