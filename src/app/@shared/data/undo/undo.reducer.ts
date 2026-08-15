/* ─── why ─────────────────────────────────────────────────────────
 * The stack is not persisted and no `loaded` action resets it: an undo
 * that survived a reload would offer to restore an item into a world that
 * no longer describes it. The cap is what stops a long session from
 * holding every item the user ever deleted.
 * ───────────────────────────────────────────────────────────────── */

import { createReducer, on } from '@ngrx/store';
import { UndoState } from '../../model/undo.types';
import { UndoActions } from './undo.actions';

const UNDO_STACK_LIMIT = 10;

export const initialUndoState: UndoState = { entries: [] };

export const undoReducer = createReducer(
  initialUndoState,
  on(UndoActions.pushed, (state, { entry }): UndoState => ({
    entries: [...state.entries, entry].slice(-UNDO_STACK_LIMIT),
  })),
  on(UndoActions.popped, (state): UndoState => ({
    entries: state.entries.slice(0, -1),
  }))
);
