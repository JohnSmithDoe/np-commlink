import { UndoEntry } from '../../model/undo.types';
import { UndoActions } from './undo.actions';
import { initialUndoState, undoReducer } from './undo.reducer';

const entry = (name: string): UndoEntry => ({
  name,
  action: { type: `[Test] restore ${name}` },
});

const stackOf = (...names: string[]) => {
  let state = initialUndoState;
  for (const name of names) {
    state = undoReducer(state, UndoActions.pushed(entry(name)));
  }
  return state;
};

describe('undoReducer', () => {
  it('returns the initial state for an unknown action', () => {
    expect(undoReducer(initialUndoState, { type: 'noop' } as never)).toBe(
      initialUndoState
    );
  });

  it('pushes the newest entry onto the top of the stack', () => {
    const state = stackOf('Milk', 'Bread');
    expect(state.entries.at(-1)).toEqual(entry('Bread'));
  });

  it('pops the top entry', () => {
    const state = undoReducer(stackOf('Milk', 'Bread'), UndoActions.popped());
    expect(state.entries).toEqual([entry('Milk')]);
  });

  it('pops an empty stack without failing', () => {
    expect(undoReducer(initialUndoState, UndoActions.popped()).entries).toEqual(
      []
    );
  });

  it('drops the oldest entry past the cap', () => {
    const names = Array.from({ length: 12 }, (_, index) => `item-${index}`);
    const state = stackOf(...names);
    expect(state.entries).toHaveLength(10);
    expect(state.entries[0]).toEqual(entry('item-2'));
  });
});
