import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action } from '@ngrx/store';
import { provideMockStore } from '@ngrx/store/testing';
import { firstValueFrom, Observable, of } from 'rxjs';
import { DashboardActions } from '../../../@shared/data/dashboard/dashboard.actions';
import { mockAppState, TMockState } from '../../../@shared/testing/test-data';
import { mockNotificationsState } from '../../testing/notifications.test-data';
import { INotification } from '../../../@shared/model/types';
import { NotificationsTelemetryEffects } from './notifications-telemetry.effects';

const NEW = '2024-06-01T00:00:00.000Z';
const VIEWED = '2024-01-01T00:00:00.000Z';

function mockNotification(
  overrides: Partial<INotification> = {}
): INotification {
  return {
    id: 'n1',
    name: 'Notice',
    createdAt: NEW,
    body: 'body',
    icon: 'ellipse',
    color: 'medium',
    status: 'new',
    updatedAt: NEW,
    ...overrides,
  };
}

describe('NotificationsTelemetryEffects', () => {
  let effects: NotificationsTelemetryEffects;

  const setup = (state: TMockState = {}) => {
    TestBed.configureTestingModule({
      providers: [
        NotificationsTelemetryEffects,
        provideMockActions(() => of() as Observable<Action>),
        provideMockStore({ initialState: mockAppState(state) }),
      ],
    });
    effects = TestBed.inject(NotificationsTelemetryEffects);
  };

  it('reports the unread badge count to the dashboard read-model', async () => {
    setup({
      notifications: mockNotificationsState({
        lastViewedAt: VIEWED,
        items: [mockNotification({ id: 'a' }), mockNotification({ id: 'b' })],
      }),
    });

    const emitted = await firstValueFrom(effects.report$);

    expect(emitted).toEqual(
      DashboardActions.report({
        source: 'notifications',
        metrics: { unread: 2 },
      })
    );
  });

  it('reports zero unread when nothing is new since last view', async () => {
    setup({
      notifications: mockNotificationsState({
        lastViewedAt: VIEWED,
        items: [mockNotification({ id: 'a', status: 'done' })],
      }),
    });

    const emitted = (await firstValueFrom(effects.report$)) as ReturnType<
      typeof DashboardActions.report
    >;

    expect(emitted.telemetry.metrics['unread']).toBe(0);
  });
});
