import { selectNotificationsUnread } from './dashboard.selector';
import { DashboardTelemetry } from '../../../@shared/model/dashboard.types';

const notifications: DashboardTelemetry = {
  source: 'notifications',
  metrics: { unread: 5 },
};

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
