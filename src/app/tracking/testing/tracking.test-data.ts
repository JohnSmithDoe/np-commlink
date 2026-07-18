import { ITrackingItem, ITrackingState } from '../model';
import { TEST_TIMESTAMP } from '../../@shared/testing/test-data';

// Deterministic tracking fixtures (type:testing), moved out of the shared
// test-data god-file so `@shared/testing` no longer imports a domain type
// (DDD review #1). Stable ids/timestamps keep equality assertions repeatable.

export function mockTrackingItem(
  overrides: Partial<ITrackingItem> = {}
): ITrackingItem {
  return {
    id: 'tracking-1',
    name: 'Ticket',
    createdAt: TEST_TIMESTAMP,
    state: 'stopped',
    ...overrides,
  };
}

export function mockTrackingState(
  overrides: Partial<ITrackingState> = {}
): ITrackingState {
  return {
    title: 'Time tracking',
    items: [],
    categories: [],
    mode: 'alphabetical',
    data: [],
    dataViewId: '',
    ...overrides,
  };
}
