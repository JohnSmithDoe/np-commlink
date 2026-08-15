import { RitualCompletion, RitualState } from '../model/ritual.types';

export function mockRitualCompletion(
  overrides: Partial<RitualCompletion> = {}
): RitualCompletion {
  return {
    promptId: 'water',
    completedAt: '2026-07-20T08:00:00.000',
    ...overrides,
  };
}

export function mockRitualState(
  overrides: Partial<RitualState> = {}
): RitualState {
  return {
    completions: [],
    dismissed: [],
    reminder: { enabled: false, hour: 18, minute: 0 },
    ...overrides,
  };
}
