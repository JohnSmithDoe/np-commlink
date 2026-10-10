import { Routes } from '@angular/router';
import { marker } from '@colsen1991/ngx-translate-extract-marker';

export const peopleRoutes: Routes = [
  {
    path: '',
    title: marker('page-title.people'),
    loadComponent: () =>
      import('../feature/people-page/people.page').then((m) => m.PeoplePage),
  },
];
