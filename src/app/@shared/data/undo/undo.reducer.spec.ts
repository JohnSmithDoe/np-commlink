import { UndoEntry } from '../../model/undo.types';
import { UndoActions } from './undo.actions';
import { initialUndoState, undoReducer } from './undo.reducer';

const STASH = '_storage';
const SHOPPING = '_shopping';

const entry = (name: string, scope = STASH): UndoEntry => ({
  scope,
  name,
  action: { type: `[Test] restore ${name}` },
});

const stackOf = (...entries: UndoEntry[]) => {
  let state = initialUndoState;
  for (const held of entries) {
    state = undoReducer(state, UndoActions.pushed(held));
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
    const state = stackOf(entry('Milk'), entry('Bread'));
    expect(state.entries.at(-1)).toEqual(entry('Bread'));
  });

  it('pops the newest entry of the named scope', () => {
    const state = undoReducer(
      stackOf(entry('Milk'), entry('Bread')),
      UndoActions.popped(STASH)
    );
    expect(state.entries).toEqual([entry('Milk')]);
  });

  it('leaves a newer entry of another scope in place', () => {
    const state = undoReducer(
      stackOf(entry('Milk'), entry('Butter', SHOPPING)),
      UndoActions.popped(STASH)
    );
    expect(state.entries).toEqual([entry('Butter', SHOPPING)]);
  });

  it('pops nothing for a scope the stack does not hold', () => {
    const state = stackOf(entry('Milk'));
    expect(undoReducer(state, UndoActions.popped(SHOPPING)).entries).toEqual(
      state.entries
    );
  });

  it('pops an empty stack without failing', () => {
    expect(
      undoReducer(initialUndoState, UndoActions.popped(STASH)).entries
    ).toEqual([]);
  });

  it('caps each scope independently', () => {
    const stash = Array.from({ length: 12 }, (_, index) =>
      entry(`stash-${index}`)
    );
    const state = stackOf(...stash, entry('Butter', SHOPPING));

    const held = state.entries.filter(({ scope }) => scope === STASH);
    expect(held).toHaveLength(10);
    expect(held[0]).toEqual(entry('stash-2'));
    expect(state.entries).toContainEqual(entry('Butter', SHOPPING));
  });
});
