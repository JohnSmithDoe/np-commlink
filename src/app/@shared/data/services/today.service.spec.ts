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

  it('does not notify when the day has not changed', () => {
    const before = service.today();

    service.refresh();

    expect(service.today()).toBe(before);
  });
});
