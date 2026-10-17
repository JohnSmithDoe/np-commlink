import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import dayjs from 'dayjs';
import { todayISO } from '../../util/formatting/date-format.utils';
import { TodayService } from './today.service';

describe('TodayService', () => {
  let service: TodayService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    service = TestBed.inject(TodayService);
  });

  it('publishes the current day as a sortable key', () => {
    expect(service.today()).toBe(dayjs().format('YYYY-MM-DD'));
    expect(service.today()).toBe(todayISO());
  });

  it('re-reads the clock when the document becomes visible again', () => {
    const refresh = vi.spyOn(service, 'refresh');

    document.dispatchEvent(new Event('visibilitychange'));

    expect(refresh).toHaveBeenCalled();
    expect(service.today()).toBe(todayISO());
  });
});

describe('TodayService at midnight', () => {
  afterEach(() => vi.useRealTimers());

  it('rolls over to the next day without being asked, and keeps doing so', () => {
    vi.useFakeTimers({ now: new Date('2026-10-17T23:59:59') });
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const service = TestBed.inject(TodayService);
    expect(service.today()).toBe('2026-10-17');

    vi.advanceTimersByTime(2000);
    expect(service.today()).toBe('2026-10-18');

    vi.advanceTimersByTime(24 * 60 * 60 * 1000);
    expect(service.today()).toBe('2026-10-19');
  });
});
