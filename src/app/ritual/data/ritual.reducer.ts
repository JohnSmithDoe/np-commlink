/* ─── why ─────────────────────────────────────────────────────────
 * The log is the record. A stored count would have to be migrated the
 * day the app wants "how many days in a row" or "how many in July", and
 * a stored-shape change on a shipped build means wiping the user's data
 * — every number this feature shows is derived from these rows instead.
 *
 * Only an undo ever shortens it, and it matches on promptId AND stamp:
 * a bonus puts a second row on the same day, so "drop the last one"
 * would take back a completion the toast was not offering.
 * ───────────────────────────────────────────────────────────────── */
import { createReducer, on } from '@ngrx/store';
import { RitualState } from '../model/ritual.types';
import { RitualActions } from './ritual.actions';

export const initialState: RitualState = {
  completions: [],
  dismissed: [],
  reminder: { enabled: false, hour: 18, minute: 0 },
};

export const ritualReducer = createReducer(
  initialState,

  on(RitualActions.completed, (state, { promptId, at }): RitualState => ({
    ...state,
    completions: [...state.completions, { promptId, completedAt: at }],
  })),

  on(RitualActions.setReminder, (state, { reminder }): RitualState => ({
    ...state,
    reminder,
  })),

  on(RitualActions.dismissed, (state, { promptId }): RitualState => ({
    ...state,
    dismissed: state.dismissed.includes(promptId)
      ? state.dismissed
      : [...state.dismissed, promptId],
  })),

  on(RitualActions.restored, (state, { promptId }): RitualState => ({
    ...state,
    dismissed: state.dismissed.filter((id) => id !== promptId),
  })),

  on(RitualActions.restoredAll, (state): RitualState => ({
    ...state,
    dismissed: [],
  })),

  on(RitualActions.loaded, (state, { ritual }): RitualState => {
    if (!ritual) return state;
    return {
      completions: ritual.completions ?? [],
      dismissed: ritual.dismissed ?? [],
      reminder: { ...state.reminder, ...ritual.reminder },
    };
  })
);
