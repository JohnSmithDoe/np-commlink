import { APP_VERSION } from '../../../@shared/model/app.consts';
import { wrapVersioned } from '../../../@shared/util/db/versioned';
import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action } from '@ngrx/store';
import { firstValueFrom, Observable, of, toArray } from 'rxjs';
import { DatabaseService } from '../../../@shared/util/db/database.service';
import { IDashboardSummary } from '../../model/dashboard.types';
import { DashboardActions } from '../../../@shared/data/actions/dashboard.actions';
import { NotificationsActions } from '../../../@shared/data/actions/notifications.actions';
import { DashboardReadModelActions } from '../actions/dashboard.actions';
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
      const summaries: IDashboardSummary[] = [
        { source: 'notifications', metrics: { unread: 2 } },
      ];
      database.loadPrefixed.mockResolvedValue(summaries);
      actions$ = of(DashboardReadModelActions.load());

      expect(await firstValueFrom(effects.load$)).toEqual(
        DashboardReadModelActions.hydrate(summaries)
      );
      // The port is asked for a key FAMILY, not for "summaries" — it stays
      // domain-blind; this context owns the prefix.
      expect(database.loadPrefixed).toHaveBeenCalledWith('summary-');
    });

    it('still reads the bare docs written before summaries were versioned', async () => {
      // Existing installs have raw summary docs on disk. `runMigrations` treats a
      // document with no envelope as version 1, so they must keep loading.
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
    it('mirrors a report to its npc-summary-<source> doc (metrics only) once hydrated', async () => {
      setup();
      // hydrate opens the gate; the subsequent report is persisted.
      actions$ = of(
        DashboardReadModelActions.hydrate([]),
        DashboardActions.report({
          source: 'office-time',
          status: 'online',
          metrics: { officedays: 12 },
        })
      );

      await firstValueFrom(effects.persistSummary$);

      // `status` is deliberately dropped on the way to disk, and the doc now
      // carries the same `{v, data}` envelope as every other persisted document.
      expect(database.save).toHaveBeenCalledWith(
        'summary-office-time',
        wrapVersioned(APP_VERSION, {
          source: 'office-time',
          metrics: { officedays: 12 },
        })
      );
    });

    it('does not persist a report that arrives before hydrate', async () => {
      setup();
      // The eager reporters' pre-hydration boot report must NOT clobber the
      // prior session's persisted summary before bootstrap reads it.
      actions$ = of(
        DashboardActions.report({
          source: 'office-time',
          metrics: { officedays: 0 },
        })
      );

      const emitted = await firstValueFrom(
        effects.persistSummary$.pipe(toArray())
      );

      expect(emitted).toEqual([]);
      expect(database.save).not.toHaveBeenCalled();
    });
  });
});
