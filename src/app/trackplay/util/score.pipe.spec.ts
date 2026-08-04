import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ScorePipe } from './score.pipe';

const pipeFor = (locale: string): ScorePipe => {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [{ provide: LOCALE_ID, useValue: locale }],
  });
  return TestBed.runInInjectionContext(() => new ScorePipe());
};

describe('ScorePipe', () => {
  const pipe = pipeFor('de-DE');

  it('formats with the active language’s thousands separators', () => {
    expect(pipeFor('en-US').transform(12_345)).toBe('12,345');

    expect(pipe.transform(42)).toBe('42');
    expect(pipe.transform(12_345)).toBe('12.345');
    expect(pipe.transform(1_000_000)).toBe('1.000.000');
  });

  it('renders falsy values as "0"', () => {
    expect(pipe.transform(0)).toBe('0');
    expect(pipe.transform(null)).toBe('0');
    expect(pipe.transform(undefined)).toBe('0');
  });

  it('renders non-finite values as "0"', () => {
    expect(pipe.transform(Number.NaN)).toBe('0');
    expect(pipe.transform(Infinity)).toBe('0');
    expect(pipe.transform(-Infinity)).toBe('0');
  });
});
