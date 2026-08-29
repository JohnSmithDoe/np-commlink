/* ─── why ─────────────────────────────────────────────────────────
 * The stack is not persisted and no `loaded` action resets it: an undo
 * that survived a reload would offer to restore an item into a world that
 * no longer describes it.
 *
 * The cap counts PER SCOPE because the button promises the recent deletes
 * of the list on screen: a global cap would let ten deletes in one list
 * evict another list's entry, making that button's depth depend on work
 * the user cannot see. Nothing prunes on navigation — leaving a list only
 * hides its entries, and dropping them would strand the toast that is
 * still offering one.
 * ───────────────────────────────────────────────────────────────── */

import { createReducer, on } from '@ngrx/store';
import { UndoState } from '../../model/undo.types';
import { indexOfNewestIn, withoutIndex } from '../../util/undo.utils';
import { UndoActions } from './undo.actions';

const UNDO_STACK_LIMIT = 10;

export const initialUndoState: UndoState = { entries: [] };

export const undoReducer = createReducer(
  initialUndoState,
  on(UndoActions.pushed, (state, { entry }): UndoState => {
    const entries = [...state.entries, entry];
    const held = entries.filter(({ scope }) => scope === entry.scope);
    return held.length <= UNDO_STACK_LIMIT
      ? { entries }
      : { entries: entries.filter((candidate) => candidate !== held[0]) };
  }),
  on(UndoActions.popped, (state, { scope }): UndoState => ({
    entries: withoutIndex(state.entries, indexOfNewestIn(state.entries, scope)),
  }))
);
