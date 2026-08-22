import dayjs from 'dayjs';
import { createBaseItem } from '../../@shared/util/app.factory';
import { Note } from '../model/notes.types';

export function createNote(name = ''): Note {
  return { ...createBaseItem(name), updatedAt: dayjs().format() };
}

export const isBlankNote = (note: Note): boolean =>
  !note.name.trim() && !note.body?.trim() && !note.images?.length;
