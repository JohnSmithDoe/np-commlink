import { IDashboardTelemetry } from '../../@shared/model/types';
import { IDashboardSummary } from '../model';
import { DashboardActions } from '../../@shared/data/dashboard/dashboard.actions';
import { DashboardReadModelActions } from './dashboard.actions';
import { dashboardReducer, initialDashboardState } from './dashboard.reducer';

const telemetry = (
  overrides: Partial<IDashboardTelemetry> = {}
): IDashboardTelemetry => ({
  source: 'notifications',
  metrics: { unread: 3 },
  ...overrides,
});

const summary = (
  overrides: Partial<IDashboardSummary> = {}
): IDashboardSummary => ({
  source: 'notifications',
  metrics: { unread: 3 },
  ...overrides,
});

describe('dashboardReducer', () => {
  it('starts with an empty read-model', () => {
    expect(initialDashboardState).toEqual({ bySource: {} });
  });

  it('report stores telemetry keyed by source and stamps it online', () => {
    const state = dashboardReducer(
      initialDashboardState,
      DashboardActions.report(telemetry())
    );
    expect(state.bySource['notifications']).toEqual({
      ...telemetry(),
      status: 'online',
    });
  });

  it('report forces status online even when the report carried standby', () => {
    const state = dashboardReducer(
      initialDashboardState,
      DashboardActions.report(telemetry({ status: 'standby' }))
    );
    expect(state.bySource['notifications'].status).toBe('online');
  });

  it('report merges distinct sources', () => {
    const first = dashboardReducer(
      initialDashboardState,
      DashboardActions.report(telemetry())
    );
    const state = dashboardReducer(
      first,
      DashboardActions.report(
        telemetry({ source: 'office-time', metrics: { officedays: 12 } })
      )
    );
    expect(Object.keys(state.bySource).toSorted()).toEqual([
      'notifications',
      'office-time',
    ]);
    expect(state.bySource['office-time'].metrics['officedays']).toBe(12);
  });

  it('report replaces the latest telemetry for the same source', () => {
    const first = dashboardReducer(
      initialDashboardState,
      DashboardActions.report(telemetry({ metrics: { unread: 3 } }))
    );
    const state = dashboardReducer(
      first,
      DashboardActions.report(telemetry({ metrics: { unread: 0 } }))
    );
    expect(state.bySource['notifications'].metrics['unread']).toBe(0);
  });

  describe('hydrate', () => {
    it('seeds the read-model from persisted summaries at standby', () => {
      const state = dashboardReducer(
        initialDashboardState,
        DashboardReadModelActions.hydrate([
          summary(),
          summary({ source: 'office-time', metrics: { officedays: 12 } }),
        ])
      );
      expect(state.bySource['notifications']).toEqual({
        ...summary(),
        status: 'standby',
      });
      expect(state.bySource['office-time'].status).toBe('standby');
    });

    it('replaces the whole read-model (cold snapshot wins)', () => {
      const withReport = dashboardReducer(
        initialDashboardState,
        DashboardActions.report(telemetry({ source: 'cash' }))
      );
      const state = dashboardReducer(
        withReport,
        DashboardReadModelActions.hydrate([summary()])
      );
      expect(Object.keys(state.bySource)).toEqual(['notifications']);
      expect(state.bySource['cash']).toBeUndefined();
    });

    it('hydrates an empty read-model from no summaries', () => {
      const state = dashboardReducer(
        initialDashboardState,
        DashboardReadModelActions.hydrate([])
      );
      expect(state).toEqual({ bySource: {} });
    });
  });
});
