import { inject } from '@angular/core';
import { Routes } from '@angular/router';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { NoteImageStore, notesContext } from '../data';

export const notesRoutes: Routes = [
  {
    path: '',
    providers: notesContext.providers,
    resolve: {
      ...notesContext.resolve,
      noteImages: () => inject(NoteImageStore).hydrate(),
    },
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
