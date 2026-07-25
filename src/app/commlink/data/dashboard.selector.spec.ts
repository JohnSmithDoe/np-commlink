import { IDashboardTelemetry } from '../../@shared/model/types';
import {
  selectNotificationsUnread,
  selectTelemetry,
} from './dashboard.selector';

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

describe('selectNotificationsUnread', () => {
  it('surfaces the unread metric from the read-model for the badge', () => {
    expect(
      selectNotificationsUnread.projector({ bySource: { notifications } })
    ).toBe(5);
  });

  it('is 0 when notifications has not reported (cold, pre-visit)', () => {
    expect(selectNotificationsUnread.projector({ bySource: {} })).toBe(0);
  });
});
