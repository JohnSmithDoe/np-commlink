import dayjs from 'dayjs';
import {
  mockRitualCompletion,
  mockRitualState,
} from '../testing/ritual.test-data';
import { RitualActions } from './ritual.actions';
import { initialState, ritualReducer } from './ritual.reducer';

describe('ritualReducer', () => {
  it('appends a completion rather than counting one', () => {
    const before = mockRitualState({
      completions: [mockRitualCompletion({ promptId: 'water' })],
    });

    const after = ritualReducer(
      before,
      RitualActions.completed('stretch', '2026-07-21T09:00:00.000')
    );

    expect(after.completions).toEqual([
      ...before.completions,
      {
        promptId: 'stretch',
        completedAt: dayjs('2026-07-21T09:00:00.000').format(),
      },
    ]);
  });

  it('stamps the local calendar day, whatever zone the caller handed it', () => {
    const lateEvening = dayjs('2026-07-20T23:30:00');

    const after = ritualReducer(
      mockRitualState(),
      RitualActions.completed('water', lateEvening.toDate().toISOString())
    );

    expect(after.completions[0]?.completedAt.slice(0, 10)).toBe('2026-07-20');
  });

  it('keeps a second completion on the same day — a bonus still counts', () => {
    const state = ritualReducer(
      mockRitualState(),
      RitualActions.completed('water', '2026-07-20T08:00:00.000')
    );

    const after = ritualReducer(
      state,
      RitualActions.completed('stretch', '2026-07-20T20:00:00.000')
    );

    expect(after.completions.length).toBe(2);
  });

  it('stores the reminder settings', () => {
    const after = ritualReducer(
      mockRitualState(),
      RitualActions.setReminder({ enabled: true, hour: 7, minute: 30 })
    );

    expect(after.reminder).toEqual({ enabled: true, hour: 7, minute: 30 });
  });

  it('keeps the default reminder when the stored slice predates it', () => {
    const after = ritualReducer(
      initialState,
      RitualActions.loaded({
        completions: [mockRitualCompletion()],
      } as never)
    );

    expect(after.reminder).toEqual(initialState.reminder);
    expect(after.completions.length).toBe(1);
  });

  it('keeps what it has when there is nothing stored yet', () => {
    const after = ritualReducer(initialState, RitualActions.loaded(null));

    expect(after).toBe(initialState);
  });
});

describe('ritualReducer dismissals', () => {
  it('remembers a dismissed prompt', () => {
    const after = ritualReducer(
      mockRitualState(),
      RitualActions.dismissed('water')
    );

    expect(after.dismissed).toEqual(['water']);
  });

  it('dismissing twice does not list it twice', () => {
    const once = ritualReducer(
      mockRitualState(),
      RitualActions.dismissed('water')
    );

    const twice = ritualReducer(once, RitualActions.dismissed('water'));

    expect(twice.dismissed).toEqual(['water']);
  });

  it('takes a single dismissal back', () => {
    const state = mockRitualState({ dismissed: ['water', 'stretch'] });

    const after = ritualReducer(state, RitualActions.restored('water'));

    expect(after.dismissed).toEqual(['stretch']);
  });

  it('takes every dismissal back at once', () => {
    const state = mockRitualState({ dismissed: ['water', 'stretch'] });

    const after = ritualReducer(state, RitualActions.restoredAll());

    expect(after.dismissed).toEqual([]);
  });

  it('hydrates a slice stored before dismissals existed', () => {
    const after = ritualReducer(
      initialState,
      RitualActions.loaded({ completions: [] } as never)
    );

    expect(after.dismissed).toEqual([]);
  });
});
