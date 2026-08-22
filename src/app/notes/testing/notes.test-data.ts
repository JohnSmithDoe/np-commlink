import { Note, NOTES_LIST_ID, NotesState } from '../model/notes.types';

export function mockNote(overrides: Partial<Note> = {}): Note {
  return { id: 'note-1', name: 'Einkauf', ...overrides };
}

export function mockNotesState(items: Note[] = [mockNote()]): NotesState {
  return { list: { id: NOTES_LIST_ID, items } };
}
