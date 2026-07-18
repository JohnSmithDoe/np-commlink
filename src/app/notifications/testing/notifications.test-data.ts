import { INotificationsState } from '../../@shared/types';
import { TEST_TIMESTAMP } from '../../@shared/testing/test-data';

// Deterministic notifications fixtures. Owned by the notifications context (DDD
// review #1): they live here, not in the shared @shared/testing kit, because
// that kit is domain:shared and may not reference a domain slice's fixture
// factory (Sheriff-enforced). The INotificationsState *type* deliberately stays
// in @shared/types — it is the payload contract of the shared durable
// write-port (@shared/util/notifications/*) that the tracking domain also
// writes through, so it must remain shared-kernel; only the fixture moves.
export function mockNotificationsState(
  overrides: Partial<INotificationsState> = {}
): INotificationsState {
  return {
    items: [],
    doneCollapsed: true,
    lastViewedAt: TEST_TIMESTAMP,
    ...overrides,
  };
}
