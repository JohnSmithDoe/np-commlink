import { createActionGroup, emptyProps } from '@ngrx/store';
import { TrackplayState } from '../model/trackplay.types';

export const TrackplayActions = createActionGroup({
  source: 'Trackplay',
  events: {
    load: emptyProps(),
    loaded: (trackplay: TrackplayState | null) => ({ trackplay }),
    restoreLastDeleted: emptyProps(),
  },
});
