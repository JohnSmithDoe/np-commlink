import { TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { NpTimeWithUnitPipe } from './np-time-with-unit.pipe';

// The pipe only calls translate.instant(key); a stub that echoes the key lets
// us assert both the chosen unit and the formatted number without loading i18n.
const translateStub = {
  instant: (key: string) => key,
} as unknown as TranslateService;

describe('NpTimeWithUnitPipe', () => {
  const pipe = TestBed.configureTestingModule({
    providers: [{ provide: TranslateService, useValue: translateStub }],
  }).runInInjectionContext(() => new NpTimeWithUnitPipe());

  it('returns an empty string for zero or undefined', () => {
    expect(pipe.transform(0)).toBe('');
    expect(pipe.transform()).toBe('');
  });

  it('renders days once a full day is reached, trimming a trailing .0', () => {
    expect(pipe.transform(172_800)).toBe('2 time.unit.days');
    expect(pipe.transform(90_000)).toBe('1 time.unit.days');
  });

  it('renders fractional hours below a day', () => {
    expect(pipe.transform(3600)).toBe('1 time.unit.hours');
    expect(pipe.transform(5400)).toBe('1.5 time.unit.hours');
  });

  it('renders minutes below an hour', () => {
    expect(pipe.transform(60)).toBe('1 time.unit.minutes');
  });

  it('renders whole seconds below a minute', () => {
    expect(pipe.transform(30)).toBe('30 time.unit.seconds');
  });
});
