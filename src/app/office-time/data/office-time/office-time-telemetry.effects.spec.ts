import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action } from '@ngrx/store';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import dayjs from 'dayjs';
import { firstValueFrom, Observable, of } from 'rxjs';
import { DashboardActions } from '../../../@shared/util/dashboard/dashboard.actions';
import { mockAppState } from '../../../@shared/testing/test-data';
import { mockOfficeTimeState } from '../../testing/office-time.test-data';
import { IAppState } from '../../../@shared/types';
import { OfficeTimeTelemetryEffects } from './office-time-telemetry.effects';
import { calculateStats } from './office-time.utils';

type ReportAction = ReturnType<typeof DashboardActions.report>;

describe('OfficeTimeTelemetryEffects', () => {
  let effects: OfficeTimeTelemetryEffects;
  let store: MockStore;

  // Pin "now" to a fixed mid-year date (Date only, not timers) so the seeded
  // officedays [now, now-1day] never straddle the year boundary — otherwise on
  // Jan 1 the previous day falls in last year and calculateStats('year') counts
  // 1 instead of 2 (a latent once-a-year false failure).
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-07-15T12:00:00.000Z'));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  const setup = (state: Partial<IAppState> & Record<string, unknown> = {}) => {
    TestBed.configureTestingModule({
      providers: [
        OfficeTimeTelemetryEffects,
        provideMockActions(() => of() as Observable<Action>),
        provideMockStore({ initialState: mockAppState(state) }),
      ],
    });
    effects = TestBed.inject(OfficeTimeTelemetryEffects);
    store = TestBed.inject(MockStore);
  };

  it('reports year officedays + the concrete percentage to the dashboard read-model', async () => {
    const officedays = [dayjs(), dayjs().subtract(1, 'day')];
    // Source-of-truth for the seeded state: the same pure calculation the
    // selector runs. Asserting the concrete value (not just its type) pins the
    // number the effect must forward, while staying deterministic across the
    // year the suite happens to run in.
    const expected = calculateStats('year', {
      officedays,
      freedays: [],
      holidays: {},
      targetOfficeDaysPerWeek: 3,
    });

    setup({
      officeTime: mockOfficeTimeState({
        targetOfficeDaysPerWeek: 3,
        officedays,
      }),
    });

    const emitted = (await firstValueFrom(effects.report$)) as ReportAction;

    expect(emitted.type).toBe(DashboardActions.report.type);
    expect(emitted.telemetry.source).toBe('office-time');
    expect(emitted.telemetry.metrics['officedays']).toBe(2);
    expect(emitted.telemetry.metrics['percentage']).toBe(expected.percentage);
  });

  it('re-emits updated telemetry when the office-time state changes', () => {
    setup({
      officeTime: mockOfficeTimeState({
        targetOfficeDaysPerWeek: 3,
        officedays: [dayjs(), dayjs().subtract(1, 'day')],
      }),
    });

    const emissions: ReportAction[] = [];
    const sub = effects.report$.subscribe((action) =>
      emissions.push(action as ReportAction)
    );

    // Initial subscription fires the current value.
    expect(emissions).toHaveLength(1);
    expect(emissions[0].telemetry.metrics['officedays']).toBe(2);

    // A store change re-drives the `store.select(...).pipe(map(→report))` effect.
    const nextOfficedays = [dayjs()];
    const nextExpected = calculateStats('year', {
      officedays: nextOfficedays,
      freedays: [],
      holidays: {},
      targetOfficeDaysPerWeek: 3,
    });
    store.setState(
      mockAppState({
        officeTime: mockOfficeTimeState({
          targetOfficeDaysPerWeek: 3,
          officedays: nextOfficedays,
        }),
      })
    );
    store.refreshState();

    expect(emissions.length).toBeGreaterThanOrEqual(2);
    const latest = emissions.at(-1)!;
    expect(latest.telemetry.metrics['officedays']).toBe(1);
    expect(latest.telemetry.metrics['percentage']).toBe(
      nextExpected.percentage
    );

    sub.unsubscribe();
  });
});
