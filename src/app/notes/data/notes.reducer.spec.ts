import { Note, NOTES_LIST_ID, NotesState } from '../model/notes.types';
import { NotesActions } from './notes.actions';
import { initialState, notesReducer } from './notes.reducer';

const note = (id: string, name = '', body?: string): Note => ({
  id,
  name,
  body,
});

const stateWith = (...items: Note[]): NotesState => ({
  list: { id: NOTES_LIST_ID, items },
});

const pinnedNote = (id: string): Note => ({ ...note(id, id), pinned: true });

describe('notesReducer', () => {
  it('keeps an untitled note, which the shared list utils would drop', () => {
    const next = notesReducer(initialState, NotesActions.addItem(note('a')));

    expect(next.list.items).toHaveLength(1);
  });

  it('adds the newest note first', () => {
    const next = notesReducer(
      stateWith(note('a', 'Alt')),
      NotesActions.addItem(note('b', 'Neu'))
    );

    expect(next.list.items.map(({ id }) => id)).toEqual(['b', 'a']);
  });

  it('updates by id, not by title, so twins stay separate', () => {
    const next = notesReducer(
      stateWith(note('a', 'Einkauf'), note('b', 'Einkauf')),
      NotesActions.updateItem({ id: 'b', name: 'Einkauf', body: 'Brot' })
    );

    expect(next.list.items.map(({ body }) => body)).toEqual([
      undefined,
      'Brot',
    ]);
  });

  it('merges a partial update instead of replacing the note', () => {
    const next = notesReducer(
      stateWith(note('a', 'Einkauf', 'Milch')),
      NotesActions.updateItem({ id: 'a', name: 'Markt' })
    );

    expect(next.list.items[0]).toMatchObject({ name: 'Markt', body: 'Milch' });
  });

  it('drops a discarded blank note', () => {
    const next = notesReducer(
      stateWith(note('a'), note('b', 'Bleibt')),
      NotesActions.discardBlank('a')
    );

    expect(next.list.items.map(({ id }) => id)).toEqual(['b']);
  });

  it('forgets the search on hydration, so a reload opens the whole list', () => {
    const stored: NotesState = {
      list: {
        id: NOTES_LIST_ID,
        items: [note('a', 'Einkauf')],
        searchQuery: 'ein',
      },
    };

    const next = notesReducer(initialState, NotesActions.loaded(stored));

    expect(next.list.searchQuery).toBeUndefined();
    expect(next.list.items).toHaveLength(1);
  });
});

describe('notesReducer arrangement', () => {
  it('pins and unpins the same note through one action', () => {
    const pinned = notesReducer(
      stateWith(note('a', 'Einkauf')),
      NotesActions.togglePin('a')
    );
    expect(pinned.list.items[0]?.pinned).toBe(true);

    const unpinned = notesReducer(pinned, NotesActions.togglePin('a'));
    expect(unpinned.list.items[0]?.pinned).toBe(false);
  });

  it('rearranges one section and leaves the other where it was', () => {
    const state = stateWith(
      pinnedNote('p1'),
      note('u1', 'U1'),
      pinnedNote('p2'),
      note('u2', 'U2')
    );

    const next = notesReducer(
      state,
      NotesActions.reorderSection(true, ['p2', 'p1'])
    );

    expect(next.list.items.map(({ id }) => id)).toEqual([
      'p2',
      'u1',
      'p1',
      'u2',
    ]);
  });

  it('refuses a partial order, which is what a filtered drag would send', () => {
    const state = stateWith(note('a', 'A'), note('b', 'B'), note('c', 'C'));

    const next = notesReducer(state, NotesActions.reorderSection(false, ['c']));

    expect(next.list.items.map(({ id }) => id)).toEqual(['a', 'b', 'c']);
  });
});
