import { TestBed } from '@angular/core/testing';
import { Action } from '@ngrx/store';
import { provideMockActions } from '@ngrx/effects/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { firstValueFrom, Observable, of } from 'rxjs';
import {
  mockAppState,
  mockTrackingItem,
  mockTrackingState,
} from '../../@shared/testing/test-data';
import { updatedSearchQuery } from '../../@shared/util/item-list/item-list.utils';
import { TrackingActions } from './tracking.actions';
import { TrackingSearchEffects } from './tracking-search.effects';

describe('TrackingSearchEffects', () => {
  let actions$: Observable<Action>;
  let effects: TrackingSearchEffects;

  const setup = (initialState = mockAppState()) => {
    TestBed.configureTestingModule({
      providers: [
        TrackingSearchEffects,
        provideMockActions(() => actions$),
        provideMockStore({ initialState }),
      ],
    });
    effects = TestBed.inject(TrackingSearchEffects);
    return initialState;
  };

  describe('addOrUpdateItem$', () => {
    it('updates a tracking item that already exists', async () => {
      const item = mockTrackingItem();
      setup(mockAppState({ tracking: mockTrackingState({ items: [item] }) }));
      actions$ = of(TrackingActions.addOrUpdateItem(item));
      expect(await firstValueFrom(effects.addOrUpdateItem$)).toEqual(
        TrackingActions.updateItem(item)
      );
    });

    it('adds a tracking item when the list is empty', async () => {
      const item = mockTrackingItem();
      setup(mockAppState({ tracking: mockTrackingState({ items: [] }) }));
      actions$ = of(TrackingActions.addOrUpdateItem(item));
      expect(await firstValueFrom(effects.addOrUpdateItem$)).toEqual(
        TrackingActions.addItem(item)
      );
    });
  });

  it('addItemFromSearch$ adds an item built from the search query', async () => {
    setup(
      mockAppState({
        tracking: mockTrackingState({ searchQuery: 'New activity', items: [] }),
      })
    );
    actions$ = of(TrackingActions.addItemFromSearch());
    const result = await firstValueFrom(effects.addItemFromSearch$);
    expect(result.type).toBe(TrackingActions.addItem.type);
  });

  it('clearSearch$ resets the tracking search on add item', async () => {
    setup();
    actions$ = of(TrackingActions.addItem(mockTrackingItem()));
    expect(await firstValueFrom(effects.clearSearch$)).toEqual(
      TrackingActions.updateSearch('')
    );
  });

  it('updateSearch$ recomputes the search query on update item', async () => {
    const item = mockTrackingItem({ name: 'Ticket' });
    setup(
      mockAppState({ tracking: mockTrackingState({ searchQuery: 'Tic' }) })
    );
    actions$ = of(TrackingActions.updateItem(item));
    expect(await firstValueFrom(effects.updateSearch$)).toEqual(
      TrackingActions.updateSearch(updatedSearchQuery(item, 'Tic'))
    );
  });
});
