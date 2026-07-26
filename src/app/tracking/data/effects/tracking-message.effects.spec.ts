import { TestBed } from '@angular/core/testing';
import { Action } from '@ngrx/store';
import { provideMockActions } from '@ngrx/effects/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { firstValueFrom, Observable, of, toArray } from 'rxjs';
import { mockKernelState } from '../../../@shared/testing/test-data';
import { mockTrackingItem } from '../../testing/tracking.test-data';
import { NotificationsActions } from '../../../@shared/data/actions/notifications.actions';
import { TrackingActions } from '../actions/tracking.actions';
import { TrackingMessageEffects } from './tracking-message.effects';

describe('TrackingMessageEffects', () => {
  let actions$: Observable<Action>;
  let effects: TrackingMessageEffects;

  const setup = () => {
    TestBed.configureTestingModule({
      providers: [
        TrackingMessageEffects,
        provideMockActions(() => actions$),
        provideMockStore({ initialState: mockKernelState() }),
      ],
    });
    effects = TestBed.inject(TrackingMessageEffects);
  };

  it('savedSuccess$ raises the saved toast', async () => {
    setup();
    actions$ = of(TrackingActions.saveAndResetTracking());
    expect(await firstValueFrom(effects.savedSuccess$)).toEqual(
      NotificationsActions.toast({ key: 'toast.saved' })
    );
  });

  it('addItemSuccess$ raises the add-item toast for a named item', async () => {
    setup();
    actions$ = of(
      TrackingActions.addItem(mockTrackingItem({ name: 'Ticket' }))
    );
    expect(await firstValueFrom(effects.addItemSuccess$)).toEqual(
      NotificationsActions.toast({
        key: 'toast.add.item',
        params: { name: 'Ticket' },
      })
    );
  });

  it('addItemSuccess$ ignores an item with a blank name', async () => {
    setup();
    actions$ = of(TrackingActions.addItem(mockTrackingItem({ name: '' })));
    expect(
      await firstValueFrom(effects.addItemSuccess$.pipe(toArray()))
    ).toEqual([]);
  });

  it('addItemFailure$ raises the item-contained toast', async () => {
    setup();
    actions$ = of(
      TrackingActions.addItemFailure(mockTrackingItem({ name: 'Ticket' }))
    );
    expect(await firstValueFrom(effects.addItemFailure$)).toEqual(
      NotificationsActions.toast({
        key: 'toast.add.item.failure',
        params: { name: 'Ticket' },
        color: 'medium',
      })
    );
  });

  it('updateItemSuccess$ raises the update-item toast', async () => {
    setup();
    actions$ = of(
      TrackingActions.updateItem(mockTrackingItem({ name: 'Ticket' }))
    );
    expect(await firstValueFrom(effects.updateItemSuccess$)).toEqual(
      NotificationsActions.toast({
        key: 'toast.update.item',
        params: { name: 'Ticket' },
      })
    );
  });

  it('removeItemSuccess$ raises the remove-item toast', async () => {
    setup();
    actions$ = of(
      TrackingActions.removeItem(mockTrackingItem({ name: 'Ticket' }))
    );
    expect(await firstValueFrom(effects.removeItemSuccess$)).toEqual(
      NotificationsActions.toast({
        key: 'toast.remove.item',
        params: { name: 'Ticket' },
        color: 'warning',
      })
    );
  });
});
