import { IDashboardSummary } from '../../model/dashboard.types';
import { DashboardActions } from '../../../@shared/data/actions/dashboard.actions';
import { DashboardReadModelActions } from '../actions/dashboard.actions';
import { dashboardReducer, initialDashboardState } from './dashboard.reducer';
import { IDashboardTelemetry } from '../../../@shared/model/dashboard.types';

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

    it('keeps a source that already reported live (it beat the storage read)', () => {
      const withReport = dashboardReducer(
        initialDashboardState,
        DashboardActions.report(telemetry({ metrics: { unread: 7 } }))
      );
      const state = dashboardReducer(
        withReport,
        DashboardReadModelActions.hydrate([summary({ metrics: { unread: 3 } })])
      );
      expect(state.bySource['notifications']).toEqual({
        ...telemetry({ metrics: { unread: 7 } }),
        status: 'online',
      });
    });

    it('adds the persisted sources alongside a live one', () => {
      const withReport = dashboardReducer(
        initialDashboardState,
        DashboardActions.report(telemetry({ source: 'cash' }))
      );
      const state = dashboardReducer(
        withReport,
        DashboardReadModelActions.hydrate([summary()])
      );
      expect(Object.keys(state.bySource).toSorted()).toEqual([
        'cash',
        'notifications',
      ]);
      expect(state.bySource['cash'].status).toBe('online');
      expect(state.bySource['notifications'].status).toBe('standby');
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
