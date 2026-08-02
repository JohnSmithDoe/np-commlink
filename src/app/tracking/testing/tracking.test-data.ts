import { TrackingItem, TrackingState } from '../model/tracking.types';
import { TEST_TIMESTAMP } from '../../@shared/testing/test-data';

export function mockTrackingItem(
  overrides: Partial<TrackingItem> = {}
): TrackingItem {
  return {
    id: 'tracking-1',
    name: 'Ticket',
    createdAt: TEST_TIMESTAMP,
    state: 'stopped',
    ...overrides,
  };
}

export function mockTrackingState(
  overrides: Partial<TrackingState> = {}
): TrackingState {
  return {
    items: [],
    sessions: [],
    sessionsViewId: 'all',
    ...overrides,
  };
}
