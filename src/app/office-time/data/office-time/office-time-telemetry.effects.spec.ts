import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action } from '@ngrx/store';
import { provideMockStore } from '@ngrx/store/testing';
import dayjs from 'dayjs';
import { firstValueFrom, Observable, of } from 'rxjs';
import { DashboardActions } from '../../../@shared/data/dashboard/dashboard.actions';
import {
  mockAppState,
  mockOfficeTimeState,
} from '../../../@shared/testing/test-data';
import { IAppState } from '../../../@shared/types';
import { OfficeTimeTelemetryEffects } from './office-time-telemetry.effects';

describe('OfficeTimeTelemetryEffects', () => {
  let effects: OfficeTimeTelemetryEffects;

  const setup = (state: Partial<IAppState> = {}) => {
    TestBed.configureTestingModule({
      providers: [
        OfficeTimeTelemetryEffects,
        provideMockActions(() => of() as Observable<Action>),
        provideMockStore({ initialState: mockAppState(state) }),
      ],
    });
    effects = TestBed.inject(OfficeTimeTelemetryEffects);
  };

  it('reports year officedays + percentage to the dashboard read-model', async () => {
    setup({
      officeTime: mockOfficeTimeState({
        targetOfficeDaysPerWeek: 3,
        officedays: [dayjs(), dayjs().subtract(1, 'day')],
      }),
    });

    const emitted = (await firstValueFrom(effects.report$)) as ReturnType<
      typeof DashboardActions.report
    >;

    expect(emitted.type).toBe(DashboardActions.report.type);
    expect(emitted.telemetry.source).toBe('office-time');
    expect(emitted.telemetry.metrics['officedays']).toBe(2);
    expect(typeof emitted.telemetry.metrics['percentage']).toBe('number');
  });
});
