import { TestBed } from '@angular/core/testing';
import { Action } from '@ngrx/store';
import { provideMockActions } from '@ngrx/effects/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { firstValueFrom, Observable, of } from 'rxjs';
import {
  mockAppState,
  mockNotificationsState,
  mockTrackingItem,
  mockTrackingState,
} from './@shared/testing/test-data';
import { updatedSearchQuery } from './@shared/data/item-list/item-list.utils';
import { DatabaseService } from './@shared/util/database.service';
import { UiService } from './@shared/util/ui.service';
import { TrackingActions } from './tracking/data/tracking.actions';
import { NotificationsActions } from './@shared/data/notifications/notifications.actions';
import { AppEffects } from './app.effects';

describe('AppEffects', () => {
  let actions$: Observable<Action>;
  let effects: AppEffects;
  let database: {
    save: ReturnType<typeof vi.fn>;
  };
  let ui: {
    showToast: ReturnType<typeof vi.fn>;
    translate: { instant: ReturnType<typeof vi.fn> };
  };

  const setup = (initialState = mockAppState()) => {
    database = {
      save: vi.fn().mockResolvedValue(undefined),
    };
    ui = {
      showToast: vi.fn().mockResolvedValue(undefined),
      translate: { instant: vi.fn().mockImplementation((k: string) => k) },
    };
    TestBed.configureTestingModule({
      providers: [
        AppEffects,
        provideMockActions(() => actions$),
        provideMockStore({ initialState }),
        { provide: DatabaseService, useValue: database },
        { provide: UiService, useValue: ui },
      ],
    });
    effects = TestBed.inject(AppEffects);
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

  it('saveOnChange$ persists the tracking slice on add item', async () => {
    const initialState = setup();
    actions$ = of(TrackingActions.addItem(mockTrackingItem()));
    await firstValueFrom(effects.saveOnChange$);
    expect(database.save).toHaveBeenCalledWith(
      'tracking',
      initialState.tracking
    );
  });

  it('saveNotificationsOnChange$ persists the notifications slice', async () => {
    const initialState = setup(
      mockAppState({ notifications: mockNotificationsState() })
    );
    actions$ = of(NotificationsActions.addNotification({} as never));
    await firstValueFrom(effects.saveNotificationsOnChange$);
    expect(database.save).toHaveBeenCalledWith(
      'notifications',
      initialState.notifications
    );
  });
});
