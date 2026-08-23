import { TestBed } from '@angular/core/testing';
import { Action } from '@ngrx/store';
import { provideMockActions } from '@ngrx/effects/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { firstValueFrom, Observable, of } from 'rxjs';
import { mockKernelState } from '../../@shared/testing/test-data';
import { NotificationsActions } from '../../@shared/data/actions/notifications.actions';
import { TrackingActions } from './tracking.actions';
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
});
