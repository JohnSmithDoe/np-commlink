import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MoneyEurPipe } from './money.pipe';

const pipeFor = (locale: string): MoneyEurPipe => {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [{ provide: LOCALE_ID, useValue: locale }],
  });
  return TestBed.runInInjectionContext(() => new MoneyEurPipe());
};

describe('MoneyEurPipe', () => {
  const pipe = pipeFor('de-DE');

  it('renders cents as a de-DE euro amount', () => {
    const out = pipe.transform(1234);
    expect(out).toContain('12,34');
    expect(out).toContain('€');
  });

  it('follows the active locale', () => {
    expect(pipeFor('en-US').transform(1234)).toContain('12.34');
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
