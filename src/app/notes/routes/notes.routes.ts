import { Routes } from '@angular/router';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { notesContext } from '../data';

export const notesRoutes: Routes = [
  {
    path: '',
    ...notesContext,
    children: [
      {
        path: '',
        title: marker('page-title.notes'),
        loadComponent: () =>
          import('../feature/notes-page/notes.page').then((m) => m.NotesPage),
      },
      {
        path: ':id',
        title: marker('page-title.note'),
        loadComponent: () =>
          import('../feature/note-editor-page/note-editor.page').then(
            (m) => m.NoteEditorPage
          ),
      },
    ],
  },
];
