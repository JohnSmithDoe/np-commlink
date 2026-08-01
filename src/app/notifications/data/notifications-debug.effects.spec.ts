import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { Action } from '@ngrx/store';
import { firstValueFrom, Observable, of } from 'rxjs';
import { NotificationsActions } from '../../@shared/data/actions/notifications.actions';
import { NotificationsInboxActions } from './notifications.actions';
import { NotificationsDebugEffects } from './notifications-debug.effects';

describe('NotificationsDebugEffects', () => {
  let effects: NotificationsDebugEffects;

  const setup = (actions$: Observable<Action>) => {
    TestBed.configureTestingModule({
      providers: [
        NotificationsDebugEffects,
        provideMockActions(() => actions$),
        // The fixture translates its own title/body, like every other producer:
        // the inbox stores rendered text, not keys.
        provideTranslateService(),
      ],
    });
    effects = TestBed.inject(NotificationsDebugEffects);
  };

  it('fabricates an actionable debug notification without reading tracking', async () => {
    setup(of(NotificationsInboxActions.addDebugNotification()));

    const emitted = await firstValueFrom(effects.addDebugNotification$);

    expect(emitted.type).toBe(NotificationsActions.notify.type);
    const { notification } = emitted as ReturnType<
      typeof NotificationsActions.notify
    >;
    expect(notification.status).toBe('open');
    // Synthetic (not from tracking state) but carries a target id, so the
    // deep-link CTA flow is exercisable end-to-end.
    expect(notification.action?.targetId).toBeTruthy();
    expect(['debug.start', 'debug.stop', 'debug.pause']).toContain(
      notification.action?.type
    );
    // The label rides on the action: the inbox renders the CTA without knowing
    // what the command means.
    expect(notification.action?.labelKey).toMatch(/^notifications\.action\./);
    // Title and body are rendered by the producer, so they arrive as text —
    // here the raw key, since the spec loads no bundle.
    expect(notification.name).toMatch(/^notifications\.debug\./);
    expect(notification.body).toMatch(/^notifications\.debug\./);
  });
});
