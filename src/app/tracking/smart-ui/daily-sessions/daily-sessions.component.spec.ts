import {
  provideZonelessChangeDetection,
  signal,
  WritableSignal,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import dayjs from 'dayjs';
import { TrackingItem } from '../../model/tracking.types';
import { TodayService } from '../../../@shared/data/services/today.service';
import { selectAllTrackingSessions } from '../../data';
import { DailySessionsComponent } from './daily-sessions.component';

const session = (
  name: string,
  startTime: string,
  trackedTimeInSeconds: number,
  state: TrackingItem['state'] = 'stopped'
): TrackingItem => ({
  id: `${name}-${startTime}`,
  name,
  createdAt: startTime,
  startTime,
  trackedTimeInSeconds,
  state,
});

describe('DailySessionsComponent', () => {
  let store: MockStore;
  let today: WritableSignal<string>;

  const create = (sessions: TrackingItem[]): DailySessionsComponent => {
    store.overrideSelector(selectAllTrackingSessions, sessions);
    return TestBed.createComponent(DailySessionsComponent).componentInstance;
  };

  beforeEach(() => {
    today = signal(dayjs().format('YYYY-MM-DD'));
    TestBed.configureTestingModule({
      imports: [DailySessionsComponent],
      providers: [
        provideTranslateService(),
        provideZonelessChangeDetection(),
        provideMockStore(),
        { provide: TodayService, useValue: { today } },
      ],
    });
    store = TestBed.inject(MockStore);
  });

  afterEach(() => store.resetSelectors());

  it("keeps only today's sessions, sorted by start time", () => {
    const early = dayjs().hour(9).minute(0).second(0);
    const late = dayjs().hour(14).minute(0).second(0);
    const yesterday = dayjs().subtract(1, 'day').hour(10);

    const component = create([
      session('Late', late.format(), 3600),
      session('Early', early.format(), 1800),
      session('Yesterday', yesterday.format(), 3600),
    ]);

    const names = component.sessions().map((s) => s.name);
    expect(names).toEqual(['Early', 'Late']);
  });

  it('sums the tracked time of the visible day into a human duration', () => {
    const component = create([
      session('A', dayjs().hour(9).format(), 3600),
      session('B', dayjs().hour(11).format(), 1800),
    ]);

    expect(component.totals()).toEqual({ count: 2, duration: '1h 30m' });
  });

  it('formats a sub-hour duration without the hour part', () => {
    const component = create([session('A', dayjs().hour(9).format(), 45 * 60)]);

    expect(component.totals()).toEqual({ count: 1, duration: '45m' });
  });

  it('starts on today and refuses to page into the future', () => {
    const component = create([]);

    expect(component.isToday()).toBe(true);
    component.nextDay();
    expect(component.isToday()).toBe(true);
  });

  it('releases the next-day button once the day rolls over', () => {
    const component = create([]);
    expect(component.isToday()).toBe(true);

    today.set(dayjs().add(1, 'day').format('YYYY-MM-DD'));

    expect(component.isToday()).toBe(false);
    component.nextDay();
    expect(component.isToday()).toBe(true);
  });

  it('pages backwards and filters sessions to the selected day', () => {
    const yesterday9 = dayjs().subtract(1, 'day').hour(9).minute(0).second(0);
    const component = create([
      session('Today', dayjs().hour(9).format(), 3600),
      session('Yesterday', yesterday9.format(), 1800),
    ]);

    expect(component.sessions().map((s) => s.name)).toEqual(['Today']);

    component.prevDay();

    expect(component.isToday()).toBe(false);
    expect(component.sessions().map((s) => s.name)).toEqual(['Yesterday']);
  });
});
