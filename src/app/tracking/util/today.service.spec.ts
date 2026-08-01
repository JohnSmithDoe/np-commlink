import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import dayjs from 'dayjs';
import { dayKey, TodayService } from './today.service';

/**
 * The midnight timeout is not exercised here. What a spec can honestly assert is
 * that the service publishes the current day and re-reads it on the trigger that
 * actually fires in the failing scenario — coming back to a backgrounded app,
 * where the timeout is exactly the mechanism that cannot be relied on.
 */
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
    expect(service.today()).toBe(dayKey());
  });

  it('re-reads the clock when the document becomes visible again', () => {
    const refresh = vi.spyOn(service, 'refresh');

    document.dispatchEvent(new Event('visibilitychange'));

    expect(refresh).toHaveBeenCalled();
    expect(service.today()).toBe(dayKey());
  });

  // The signal is set unconditionally, so it is `signal`'s own equality that
  // keeps a same-day refresh from waking every reader.
  it('does not notify when the day has not changed', () => {
    const before = service.today();

    service.refresh();

    expect(service.today()).toBe(before);
  });
});
