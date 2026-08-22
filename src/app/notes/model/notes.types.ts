import { Timestamp } from '../../@shared/model/app.types';
import { BaseItem } from '../../@shared/model/base-item.types';
import { ItemList } from '../../@shared/model/item-list.types';

export const NOTES_LIST_ID = '_notes';

export type NoteImageId = string;

export interface NoteImage {
  id: NoteImageId;
  dataUrl: string;
}

export interface Note extends BaseItem {
  body?: string;
  images?: NoteImageId[];
  pinned?: boolean;
  updatedAt?: Timestamp;
}

export type NotesList = ItemList<Note> & { id: typeof NOTES_LIST_ID };

export type NotesState = Readonly<{
  list: NotesList;
}>;
