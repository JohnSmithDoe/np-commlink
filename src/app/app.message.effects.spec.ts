import { TestBed } from '@angular/core/testing';
import { Action } from '@ngrx/store';
import { provideMockActions } from '@ngrx/effects/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { firstValueFrom, Observable, of } from 'rxjs';
import { mockAppState } from './@shared/testing/test-data';
import { mockTrackingItem } from './tracking/testing/tracking.test-data';
import { UiService } from './@shared/util/ui.service';
import { TrackingActions } from './tracking/data';
import { AppMessageEffects } from './app.message.effects';

describe('AppMessageEffects', () => {
  let actions$: Observable<Action>;
  let effects: AppMessageEffects;
  let ui: Record<string, ReturnType<typeof vi.fn>>;

  const setup = () => {
    ui = {
      showSavedToast: vi.fn().mockResolvedValue(undefined),
      showAddItemToast: vi.fn().mockResolvedValue(undefined),
      showItemContainedToast: vi.fn().mockResolvedValue(undefined),
      showUpdateItemToast: vi.fn().mockResolvedValue(undefined),
      showRemoveItemToast: vi.fn().mockResolvedValue(undefined),
    };
    TestBed.configureTestingModule({
      providers: [
        AppMessageEffects,
        provideMockActions(() => actions$),
        provideMockStore({ initialState: mockAppState() }),
        { provide: UiService, useValue: ui },
      ],
    });
    effects = TestBed.inject(AppMessageEffects);
  };

  it('savedSuccess$ shows the saved toast', async () => {
    setup();
    actions$ = of(TrackingActions.saveAndResetTracking());
    await firstValueFrom(effects.savedSuccess$);
    expect(ui['showSavedToast']).toHaveBeenCalledTimes(1);
  });

  it('addItemSuccess$ shows the add-item toast for a named item', async () => {
    setup();
    actions$ = of(
      TrackingActions.addItem(mockTrackingItem({ name: 'Ticket' }))
    );
    await firstValueFrom(effects.addItemSuccess$);
    expect(ui['showAddItemToast']).toHaveBeenCalledWith('Ticket');
  });

  it('addItemSuccess$ ignores an item with a blank name', async () => {
    setup();
    actions$ = of(TrackingActions.addItem(mockTrackingItem({ name: '' })));
    await firstValueFrom(effects.addItemSuccess$);
    expect(ui['showAddItemToast']).not.toHaveBeenCalled();
  });

  it('addItemFailure$ shows the item-contained toast', async () => {
    setup();
    actions$ = of(
      TrackingActions.addItemFailure(mockTrackingItem({ name: 'Ticket' }))
    );
    await firstValueFrom(effects.addItemFailure$);
    expect(ui['showItemContainedToast']).toHaveBeenCalledWith('Ticket');
  });

  it('updateItemSuccess$ shows the update-item toast', async () => {
    setup();
    const item = mockTrackingItem({ name: 'Ticket' });
    actions$ = of(TrackingActions.updateItem(item));
    await firstValueFrom(effects.updateItemSuccess$);
    expect(ui['showUpdateItemToast']).toHaveBeenCalledWith(item);
  });

  it('removeItemSuccess$ shows the remove-item toast', async () => {
    setup();
    actions$ = of(
      TrackingActions.removeItem(mockTrackingItem({ name: 'Ticket' }))
    );
    await firstValueFrom(effects.removeItemSuccess$);
    expect(ui['showRemoveItemToast']).toHaveBeenCalledWith('Ticket');
  });
});
