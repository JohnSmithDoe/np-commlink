import { IDashboardState } from '../model';

/**
 * Deterministic fixtures for the commlink-owned dashboard read-model.
 *
 * Lives here rather than in `@shared/testing` because the read-model types are
 * commlink's: `@shared/testing` is tagged `domain:@shared`, and Sheriff checks
 * every fromTag, so it may not name a domain type even though `type:testing`
 * can reach any layer.
 *
 * Pass into the shared `mockAppState` via its `& Record<string, unknown>`
 * escape hatch — `mockAppState({ dashboard: mockDashboardState({ … }) })` —
 * the same way every other lazy domain slice does.
 */
export function mockDashboardState(
  overrides: Partial<IDashboardState> = {}
): IDashboardState {
  return { bySource: {}, ...overrides };
}
