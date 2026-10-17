import { TestBed } from '@angular/core/testing';
import { Action } from '@ngrx/store';
import { provideMockActions } from '@ngrx/effects/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { firstValueFrom, Observable, of } from 'rxjs';
import { mockKernelState, MockState } from '../../@shared/testing/test-data';
import { mockTrackingState } from '../testing/tracking.test-data';
import { TrackingActions } from './tracking.actions';
import { trackingListEffects } from './tracking-list.effects';

describe('trackingListEffects', () => {
  let actions$: Observable<Action>;

  const setup = (state: MockState = {}) => {
    TestBed.configureTestingModule({
      providers: [
        provideMockActions(() => actions$),
        provideMockStore({ initialState: mockKernelState(state) }),
      ],
    });
  };

  const run = <T>(effect: () => Observable<T>): Observable<T> =>
    TestBed.runInInjectionContext(() => effect());

  it('addItemFromSearch$ adds an item built from the search query', async () => {
    setup({
      tracking: mockTrackingState({ searchQuery: 'New activity', items: [] }),
    });
    actions$ = of(TrackingActions.addItemFromSearch());

    const result = await firstValueFrom(
      run(trackingListEffects.addItemFromSearch$)
    );

    expect(result).toEqual(
      TrackingActions.addItem(
        expect.objectContaining({ name: 'New activity' }) as never
      )
    );
  });
});
