import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action } from '@ngrx/store';
import { firstValueFrom, Observable, of, toArray } from 'rxjs';
import { DatabaseService } from '../../util/database.service';
import { UiService } from '../../util/ui.service';
import { IDashboardSummary } from '../../types';
import { DashboardActions } from '../../util/dashboard/dashboard.actions';
import { DashboardEffects } from './dashboard.effects';

describe('DashboardEffects', () => {
  let actions$: Observable<Action>;
  let effects: DashboardEffects;
  let database: {
    bootstrap: ReturnType<typeof vi.fn>;
    saveSummary: ReturnType<typeof vi.fn>;
  };
  let ui: {
    showToast: ReturnType<typeof vi.fn>;
    translate: { instant: ReturnType<typeof vi.fn> };
  };

  const setup = () => {
    database = {
      bootstrap: vi.fn().mockResolvedValue({ summaries: [] }),
      saveSummary: vi.fn().mockResolvedValue(undefined),
    };
    ui = {
      showToast: vi.fn().mockResolvedValue(undefined),
      translate: { instant: vi.fn().mockImplementation((k: string) => k) },
    };
    TestBed.configureTestingModule({
      providers: [
        DashboardEffects,
        provideMockActions(() => actions$),
        { provide: DatabaseService, useValue: database },
        { provide: UiService, useValue: ui },
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
      database.bootstrap.mockResolvedValue({ summaries });
      actions$ = of(DashboardActions.load());

      expect(await firstValueFrom(effects.load$)).toEqual(
        DashboardActions.hydrate(summaries)
      );
    });

    it('falls back to an empty hydrate and surfaces a toast when storage bootstrap fails', async () => {
      setup();
      database.bootstrap.mockRejectedValue(new Error('storage unavailable'));
      actions$ = of(DashboardActions.load());

      expect(await firstValueFrom(effects.load$)).toEqual(
        DashboardActions.hydrate([])
      );
      expect(ui.showToast).toHaveBeenCalledWith(
        'toast.storage.unavailable',
        'warning'
      );
    });
  });

  describe('persistSummary$', () => {
    it('mirrors a report to its npc-summary-<source> doc (metrics only) once hydrated', async () => {
      setup();
      // hydrate opens the gate; the subsequent report is persisted.
      actions$ = of(
        DashboardActions.hydrate([]),
        DashboardActions.report({
          source: 'office-time',
          status: 'online',
          metrics: { officedays: 12 },
        })
      );

      await firstValueFrom(effects.persistSummary$);

      expect(database.saveSummary).toHaveBeenCalledWith('office-time', {
        officedays: 12,
      });
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
      expect(database.saveSummary).not.toHaveBeenCalled();
    });
  });
});
