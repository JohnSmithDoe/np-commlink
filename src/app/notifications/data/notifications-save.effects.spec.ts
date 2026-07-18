import { TestBed } from '@angular/core/testing';
import { Action } from '@ngrx/store';
import { provideMockActions } from '@ngrx/effects/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { firstValueFrom, Observable, of } from 'rxjs';
import { mockAppState } from '../../@shared/testing/test-data';
import { mockNotificationsState } from '../testing/notifications.test-data';
import { DatabaseService } from '../../@shared/util/database.service';
import { NotificationsActions } from '../../@shared/util/notifications/notifications.actions';
import { NotificationsSaveEffects } from './notifications-save.effects';

describe('NotificationsSaveEffects', () => {
  let actions$: Observable<Action>;
  let effects: NotificationsSaveEffects;
  let database: { save: ReturnType<typeof vi.fn> };

  const setup = (initialState = mockAppState()) => {
    database = { save: vi.fn().mockResolvedValue(undefined) };
    TestBed.configureTestingModule({
      providers: [
        NotificationsSaveEffects,
        provideMockActions(() => actions$),
        provideMockStore({ initialState }),
        { provide: DatabaseService, useValue: database },
      ],
    });
    effects = TestBed.inject(NotificationsSaveEffects);
    return initialState;
  };

  it('persists the notifications slice on a mutation', async () => {
    const notifications = mockNotificationsState();
    setup(mockAppState({ notifications }));
    actions$ = of(NotificationsActions.addNotification({} as never));
    await firstValueFrom(effects.saveNotificationsOnChange$);
    expect(database.save).toHaveBeenCalledWith('notifications', notifications);
  });

  it('does NOT persist on the load lifecycle', () => {
    setup();
    actions$ = of(NotificationsActions.load());
    effects.saveNotificationsOnChange$.subscribe();
    expect(database.save).not.toHaveBeenCalled();
  });
});
