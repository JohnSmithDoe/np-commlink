import { IDashboardTelemetry } from '../../types';
import { selectTelemetry } from './dashboard.selector';

const notifications: IDashboardTelemetry = {
  source: 'notifications',
  metrics: { unread: 5 },
};

describe('selectTelemetry', () => {
  it('projects the telemetry for the requested source', () => {
    expect(
      selectTelemetry('notifications').projector({
        bySource: { notifications },
      })
    ).toEqual(notifications);
  });

  it('returns undefined for a source that has not reported', () => {
    expect(
      selectTelemetry('office-time').projector({
        bySource: { notifications },
      })
    ).toBeUndefined();
  });
});
