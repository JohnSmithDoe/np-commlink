import { ActivatedRoute } from '@angular/router';

export const routeUrl = (route: ActivatedRoute): string =>
  `/${route.snapshot.pathFromRoot
    .flatMap(({ url }) => url)
    .map(({ path }) => path)
    .join('/')}`;
