import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action } from '@ngrx/store';
import { provideMockStore } from '@ngrx/store/testing';
import { firstValueFrom, Observable, of } from 'rxjs';
import { DashboardActions } from '../../../@shared/data/dashboard/dashboard.actions';
import { mockAppState, TMockState } from '../../../@shared/testing/test-data';
import {
  mockGame,
  mockTrackplayState,
} from '../../testing/trackplay.test-data';
import {
  selectGameCount,
  TrackplayTelemetryEffects,
} from './trackplay-telemetry.effects';

describe('TrackplayTelemetryEffects', () => {
  let effects: TrackplayTelemetryEffects;

  const setup = (state: TMockState = {}) => {
    TestBed.configureTestingModule({
      providers: [
        TrackplayTelemetryEffects,
        provideMockActions(() => of() as Observable<Action>),
        provideMockStore({ initialState: mockAppState(state) }),
      ],
    });
    effects = TestBed.inject(TrackplayTelemetryEffects);
  };

  it('reports the total game count to the dashboard read-model', async () => {
    setup({
      trackplay: mockTrackplayState({
        games: { g1: mockGame({ id: 'g1' }), g2: mockGame({ id: 'g2' }) },
      }),
    });

    expect(await firstValueFrom(effects.report$)).toEqual(
      DashboardActions.report({ source: 'trackplay', metrics: { games: 2 } })
    );
  });

  describe('selectGameCount', () => {
    it('counts every game regardless of type or ended state', () => {
      expect(
        selectGameCount.projector({
          g1: mockGame({ id: 'g1', ended: true }),
          g2: mockGame({ id: 'g2' }),
          g3: mockGame({ id: 'g3' }),
        })
      ).toBe(3);
    });

    it('is 0 with no games', () => {
      expect(selectGameCount.projector({})).toBe(0);
    });
  });
});
