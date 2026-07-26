import { MoneyEurPipe } from './money.pipe';

// ICU puts a non-breaking space before the symbol and that codepoint varies by
// runtime, so assert on the parts rather than the whole string.
describe('MoneyEurPipe', () => {
  const pipe = new MoneyEurPipe();

  it('renders cents as a de-DE euro amount', () => {
    const out = pipe.transform(1234);
    expect(out).toContain('12,34');
    expect(out).toContain('€');
  });

  it('keeps the sign on an outflow', () => {
    expect(pipe.transform(-1999)).toContain('-');
    expect(pipe.transform(-1999)).toContain('19,99');
  });

  it('renders zero', () => {
    expect(pipe.transform(0)).toContain('0,00');
  });

  it('renders a nullish amount as zero', () => {
    expect(pipe.transform(null)).toBe(pipe.transform(0));
    expect(pipe.transform(undefined)).toBe(pipe.transform(0));
  });
});
