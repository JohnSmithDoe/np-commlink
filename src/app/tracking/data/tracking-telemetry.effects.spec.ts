import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action } from '@ngrx/store';
import { provideMockStore } from '@ngrx/store/testing';
import { firstValueFrom, Observable, of } from 'rxjs';
import { DashboardActions } from '../../@shared/data/dashboard/dashboard.actions';
import {
  mockAppState,
  mockTrackingItem,
  mockTrackingState,
} from '../../@shared/testing/test-data';
import { IAppState } from '../../@shared/types';
import {
  selectTrackingItemCount,
  TrackingTelemetryEffects,
} from './tracking-telemetry.effects';

describe('TrackingTelemetryEffects', () => {
  let effects: TrackingTelemetryEffects;

  const setup = (state: Partial<IAppState> = {}) => {
    TestBed.configureTestingModule({
      providers: [
        TrackingTelemetryEffects,
        provideMockActions(() => of() as Observable<Action>),
        provideMockStore({ initialState: mockAppState(state) }),
      ],
    });
    effects = TestBed.inject(TrackingTelemetryEffects);
  };

  it('reports the tracking item count to the dashboard read-model', async () => {
    setup({
      tracking: mockTrackingState({
        items: [mockTrackingItem({ id: 'a' }), mockTrackingItem({ id: 'b' })],
      }),
    });

    expect(await firstValueFrom(effects.report$)).toEqual(
      DashboardActions.report({ source: 'tracking', metrics: { count: 2 } })
    );
  });

  describe('selectTrackingItemCount', () => {
    it('counts the list items', () => {
      expect(
        selectTrackingItemCount.projector(
          mockTrackingState({ items: [mockTrackingItem()] })
        )
      ).toBe(1);
    });

    it('falls back to 0 for an unregistered slice', () => {
      expect(selectTrackingItemCount.projector(undefined as never)).toBe(0);
    });
  });
});
