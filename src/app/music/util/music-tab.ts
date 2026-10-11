import { ActivatedRoute } from '@angular/router';

const MUSIC_LIBRARY_ROOT = '/music/library';

export const musicTabOf = (route: ActivatedRoute): string => {
  const tab: unknown = route.snapshot.data['musicTab'];
  return typeof tab === 'string' ? tab : MUSIC_LIBRARY_ROOT;
};
