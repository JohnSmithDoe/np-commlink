import { TestBed } from '@angular/core/testing';
import { Action } from '@ngrx/store';
import { provideMockActions } from '@ngrx/effects/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { firstValueFrom, Observable, of } from 'rxjs';
import { mockKernelState, MockState } from '../../@shared/testing/test-data';
import { NotificationsActions } from '../../@shared/data/actions/notifications.actions';
import {
  mockTrackingItem,
  mockTrackingState,
} from '../testing/tracking.test-data';
import { updatedSearchQuery } from '../../@shared/util/item-lists/list.utils';
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

  describe('addOrUpdateItem$', () => {
    it('updates a tracking item that already exists', async () => {
      const item = mockTrackingItem();
      setup({ tracking: mockTrackingState({ items: [item] }) });
      actions$ = of(TrackingActions.addOrUpdateItem(item));

      expect(
        await firstValueFrom(run(trackingListEffects.addOrUpdateItem$))
      ).toEqual(TrackingActions.updateItem(item));
    });

    it('adds a tracking item when the list is empty', async () => {
      const item = mockTrackingItem();
      setup({ tracking: mockTrackingState({ items: [] }) });
      actions$ = of(TrackingActions.addOrUpdateItem(item));

      expect(
        await firstValueFrom(run(trackingListEffects.addOrUpdateItem$))
      ).toEqual(TrackingActions.addItem(item));
    });
  });

  it('addItemFromSearch$ adds an item built from the search query', async () => {
    setup({
      tracking: mockTrackingState({ searchQuery: 'New activity', items: [] }),
    });
    actions$ = of(TrackingActions.addItemFromSearch());

    const result = await firstValueFrom(
      run(trackingListEffects.addItemFromSearch$)
    );

    expect(result.type).toBe(TrackingActions.addItem.type);
  });

  it('clearSearch$ resets the tracking search on add item', async () => {
    setup();
    actions$ = of(TrackingActions.addItem(mockTrackingItem()));

    expect(await firstValueFrom(run(trackingListEffects.clearSearch$))).toEqual(
      TrackingActions.updateSearch('')
    );
  });

  it('syncSearchOnRename$ recomputes the search query on update item', async () => {
    const item = mockTrackingItem({ name: 'Ticket' });
    setup({ tracking: mockTrackingState({ searchQuery: 'Tic' }) });
    actions$ = of(TrackingActions.updateItem(item));

    expect(
      await firstValueFrom(run(trackingListEffects.syncSearchOnRename$))
    ).toEqual(TrackingActions.updateSearch(updatedSearchQuery(item, 'Tic')));
  });
  it('addItemFailure$ toasts a duplicate-name notice', async () => {
    setup();
    const item = mockTrackingItem({ name: 'Ticket' });
    actions$ = of(TrackingActions.addItemFailure(item));

    expect(
      await firstValueFrom(run(trackingListEffects.addItemFailure$))
    ).toEqual(
      NotificationsActions.toast({
        key: 'toast.add.item.failure',
        parameters: { name: 'Ticket' },
        color: 'medium',
      })
    );
  });
});
