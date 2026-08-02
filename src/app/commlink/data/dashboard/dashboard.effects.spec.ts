import { APP_VERSION } from '../../../@shared/model/app.consts';
import { wrapVersioned } from '../../../@shared/util/persistence/versioned';
import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action } from '@ngrx/store';
import { firstValueFrom, Observable, of, toArray } from 'rxjs';
import { DatabaseService } from '../../../@shared/util/persistence/database.service';
import { DashboardSummary } from '../../model/dashboard.types';
import { DashboardActions } from '../../../@shared/data/actions/dashboard.actions';
import { NotificationsActions } from '../../../@shared/data/actions/notifications.actions';
import { DashboardReadModelActions } from './dashboard.actions';
import { DashboardEffects } from './dashboard.effects';

describe('DashboardEffects', () => {
  let actions$: Observable<Action>;
  let effects: DashboardEffects;
  let database: {
    bootstrap: ReturnType<typeof vi.fn>;
    loadPrefixed: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
  };

  const setup = () => {
    database = {
      bootstrap: vi.fn().mockResolvedValue(undefined),
      loadPrefixed: vi.fn().mockResolvedValue([]),
      save: vi.fn().mockResolvedValue(undefined),
    };
    TestBed.configureTestingModule({
      providers: [
        DashboardEffects,
        provideMockActions(() => actions$),
        { provide: DatabaseService, useValue: database },
      ],
    });
    effects = TestBed.inject(DashboardEffects);
  };

  describe('load$', () => {
    it('hydrates the read-model from the persisted summaries', async () => {
      setup();
      const summaries: DashboardSummary[] = [
        { source: 'notifications', metrics: { unread: 2 } },
      ];
      database.loadPrefixed.mockResolvedValue(summaries);
      actions$ = of(DashboardReadModelActions.load());

      expect(await firstValueFrom(effects.load$)).toEqual(
        DashboardReadModelActions.hydrate(summaries)
      );
      expect(database.loadPrefixed).toHaveBeenCalledWith('summary-');
    });

    it('still reads the bare docs written before summaries were versioned', async () => {
      setup();
      const bare = { source: 'notifications', metrics: { unread: 2 } };
      database.loadPrefixed.mockResolvedValue([bare]);
      actions$ = of(DashboardReadModelActions.load());

      expect(await firstValueFrom(effects.load$)).toEqual(
        DashboardReadModelActions.hydrate([bare])
      );
    });

    it('drops a summary doc it cannot read rather than hydrating a hole', async () => {
      setup();
      database.loadPrefixed.mockResolvedValue([null, { nonsense: true }]);
      actions$ = of(DashboardReadModelActions.load());

      expect(await firstValueFrom(effects.load$)).toEqual(
        DashboardReadModelActions.hydrate([])
      );
    });

    it('falls back to an empty hydrate and raises a toast when storage bootstrap fails', async () => {
      setup();
      database.bootstrap.mockRejectedValue(new Error('storage unavailable'));
      actions$ = of(DashboardReadModelActions.load());

      expect(await firstValueFrom(effects.load$.pipe(toArray()))).toEqual([
        DashboardReadModelActions.hydrate([]),
        NotificationsActions.toast({
          key: 'toast.storage.unavailable',
          color: 'warning',
        }),
      ]);
    });
  });

  describe('persistSummary$', () => {
    it('mirrors a report to its npc-summary-<source> doc (metrics only)', async () => {
      setup();
      actions$ = of(
        DashboardActions.report({
          source: 'office-time',
          status: 'online',
          metrics: { officedays: 12 },
        })
      );

      await firstValueFrom(effects.persistSummary$);

      expect(database.save).toHaveBeenCalledWith(
        'summary-office-time',
        wrapVersioned(APP_VERSION, {
          source: 'office-time',
          metrics: { officedays: 12 },
        })
      );
    });

    it('persists a report that arrives before this boot read resolves', async () => {
      setup();
      actions$ = of(
        DashboardActions.report({
          source: 'office-time',
          metrics: { officedays: 12 },
        })
      );

      await firstValueFrom(effects.persistSummary$);

      expect(database.save).toHaveBeenCalledWith(
        'summary-office-time',
        wrapVersioned(APP_VERSION, {
          source: 'office-time',
          metrics: { officedays: 12 },
        })
      );
    });
  });
});
