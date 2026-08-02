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
    expect(notification.action?.targetId).toBeTruthy();
    expect(['debug.start', 'debug.stop', 'debug.pause']).toContain(
      notification.action?.type
    );
    expect(notification.action?.labelKey).toMatch(/^notifications\.action\./);
    expect(notification.name).toMatch(/^notifications\.debug\./);
    expect(notification.body).toMatch(/^notifications\.debug\./);
  });
});
