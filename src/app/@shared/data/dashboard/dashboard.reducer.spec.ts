import { IDashboardTelemetry } from '../../types';
import { DashboardActions } from './dashboard.actions';
import { dashboardReducer, initialDashboardState } from './dashboard.reducer';

const telemetry = (
  overrides: Partial<IDashboardTelemetry> = {}
): IDashboardTelemetry => ({
  source: 'notifications',
  metrics: { unread: 3 },
  ...overrides,
});

describe('dashboardReducer', () => {
  it('starts with an empty read-model', () => {
    expect(initialDashboardState).toEqual({ bySource: {} });
  });

  it('report stores telemetry keyed by source', () => {
    const state = dashboardReducer(
      initialDashboardState,
      DashboardActions.report(telemetry())
    );
    expect(state.bySource['notifications']).toEqual(telemetry());
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
    expect(Object.keys(state.bySource).sort()).toEqual([
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
});
