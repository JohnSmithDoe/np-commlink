import { TestBed } from '@angular/core/testing';
import { Store } from '@ngrx/store';
import { provideMockStore } from '@ngrx/store/testing';
import { DatabaseService } from '../../util/database.service';
import { DashboardActions } from '../dashboard/dashboard.actions';
import { INotification, INotificationsState } from '../../types';
import { NotificationsStore } from './notifications.store';
import { EMPTY_NOTIFICATIONS_STATE } from './notifications.transforms';

const notif = (overrides: Partial<INotification> = {}): INotification => ({
  id: 'n1',
  name: 'x',
  createdAt: '2026-01-01T00:00:00.000Z',
  body: '',
  icon: '',
  color: 'medium',
  status: 'new',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

describe('NotificationsStore', () => {
  let service: NotificationsStore;
  let database: {
    load: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
  };
  let dispatch: ReturnType<typeof vi.spyOn>;

  const setup = (loaded: INotificationsState | null = null) => {
    database = {
      load: vi.fn(async () => loaded),
      save: vi.fn(async () => {}),
    };
    TestBed.configureTestingModule({
      providers: [
        NotificationsStore,
        provideMockStore(),
        { provide: DatabaseService, useValue: database },
      ],
    });
    dispatch = vi.spyOn(TestBed.inject(Store), 'dispatch');
    service = TestBed.inject(NotificationsStore);
  };

  it('read falls back to the empty baseline when nothing is persisted', async () => {
    setup(null);
    expect(await service.read()).toEqual(EMPTY_NOTIFICATIONS_STATE);
  });

  it('read returns the persisted state', async () => {
    const persisted: INotificationsState = {
      items: [notif()],
      doneCollapsed: false,
      lastViewedAt: '1970-01-01T00:00:00.000Z',
    };
    setup(persisted);
    expect(await service.read()).toEqual(persisted);
  });

  it('mutate reads, applies the transform, persists, and reports unread', async () => {
    setup({
      items: [],
      doneCollapsed: true,
      lastViewedAt: '1970-01-01T00:00:00.000Z',
    });

    await service.mutate((s) => ({ ...s, items: [notif()] }));

    expect(database.save).toHaveBeenCalledWith(
      'notifications',
      expect.objectContaining({
        items: [expect.objectContaining({ id: 'n1' })],
      })
    );
    expect(dispatch).toHaveBeenCalledWith(
      DashboardActions.report({
        source: 'notifications',
        metrics: { unread: 1 },
      })
    );
  });
});
