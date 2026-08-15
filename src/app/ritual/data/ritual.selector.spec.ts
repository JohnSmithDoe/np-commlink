import {
  mockRitualCompletion,
  mockRitualState,
} from '../testing/ritual.test-data';
import {
  selectRitualCompletions,
  selectRitualCount,
  selectRitualReminder,
} from './ritual.selector';

describe('ritual selectors', () => {
  it('counts every completion, not every day', () => {
    const completions = [
      mockRitualCompletion({ completedAt: '2026-07-20T08:00:00.000' }),
      mockRitualCompletion({ completedAt: '2026-07-20T20:00:00.000' }),
    ];

    expect(selectRitualCount.projector(completions)).toBe(2);
  });

  it('starts at nothing', () => {
    expect(selectRitualCount.projector([])).toBe(0);
  });

  it('reads the log off the slice', () => {
    const state = mockRitualState({ completions: [mockRitualCompletion()] });

    expect(selectRitualCompletions.projector(state)).toBe(state.completions);
  });

  it('reads the reminder off the slice', () => {
    const state = mockRitualState({
      reminder: { enabled: true, hour: 7, minute: 15 },
    });

    expect(selectRitualReminder.projector(state)).toEqual({
      enabled: true,
      hour: 7,
      minute: 15,
    });
  });
});
