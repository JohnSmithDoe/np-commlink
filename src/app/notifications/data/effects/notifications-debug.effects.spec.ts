import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action } from '@ngrx/store';
import { firstValueFrom, Observable, of } from 'rxjs';
import { NotificationsActions } from '../../../@shared/data/notification/notifications.actions';
import { NotificationsDebugEffects } from './notifications-debug.effects';

describe('NotificationsDebugEffects', () => {
  let effects: NotificationsDebugEffects;

  const setup = (actions$: Observable<Action>) => {
    TestBed.configureTestingModule({
      providers: [
        NotificationsDebugEffects,
        provideMockActions(() => actions$),
      ],
    });
    effects = TestBed.inject(NotificationsDebugEffects);
  };

  it('fabricates an actionable debug notification without reading tracking', async () => {
    setup(of(NotificationsActions.addDebugNotification()));

    const emitted = await firstValueFrom(effects.addDebugNotification$);

    expect(emitted.type).toBe(NotificationsActions.addNotification.type);
    const { notification } = emitted as ReturnType<
      typeof NotificationsActions.addNotification
    >;
    expect(notification.status).toBe('new');
    // Synthetic (not from tracking state) but internally consistent, so the
    // deep-link CTA flow is exercisable end-to-end.
    expect(notification.action?.trackingItemId).toBe(
      notification.trackingItemId
    );
    expect(['tracking.start', 'tracking.stop', 'tracking.pause']).toContain(
      notification.action?.type
    );
  });
});
