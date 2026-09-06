import { evaluateExpression } from './expression.utils';

const value = (source: string): number => {
  const result = evaluateExpression(source);
  if (!result.ok) throw new Error(`expected a value, got ${result.reason}`);
  return result.value;
};

const reason = (source: string): string => {
  const result = evaluateExpression(source);
  if (result.ok) throw new Error(`expected a failure, got ${result.value}`);
  return result.reason;
};

describe('evaluateExpression', () => {
  it('applies multiplication before addition', () => {
    expect(value('2+3*4')).toBe(14);
  });

  it('respects parentheses', () => {
    expect(value('12*(3+4)/2')).toBe(42);
  });

  it('handles unary minus, nested', () => {
    expect(value('-3*-2')).toBe(6);
    expect(value('-(4-9)')).toBe(5);
  });

  it('accepts either decimal separator', () => {
    expect(value('1.5+1,5')).toBe(3);
  });

  it('accepts typographic operators', () => {
    expect(value('6×7')).toBe(42);
    expect(value('84÷2')).toBe(42);
    expect(value('50−8')).toBe(42);
  });

  it('ignores whitespace', () => {
    expect(value(' 1 + 2 ')).toBe(3);
  });

  it('separates an unfinished expression from a wrong one', () => {
    expect(reason('12*(3+')).toBe('incomplete');
    expect(reason('2+')).toBe('incomplete');
    expect(reason('1*/2')).toBe('syntax');
    expect(reason('1+2)')).toBe('syntax');
    expect(reason('1 2')).toBe('syntax');
  });

  it('reports division by zero, including 0/0', () => {
    expect(reason('1/0')).toBe('divide-by-zero');
    expect(reason('0/0')).toBe('divide-by-zero');
  });

  it('treats nothing as nothing, not as an error', () => {
    expect(reason('')).toBe('empty');
    expect(reason(' '.repeat(3))).toBe('empty');
  });

  it('rejects an unknown character', () => {
    expect(reason('2+a')).toBe('syntax');
  });
});
