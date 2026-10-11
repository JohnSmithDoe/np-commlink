import { createActionGroup, emptyProps } from '@ngrx/store';
import { uuidv4 } from '../../@shared/util/app.utils';
import { JamSession, MusicFolder, MusicState } from '../model/music.types';

export const MusicActions = createActionGroup({
  source: 'Music',
  events: {
    load: emptyProps(),
    loaded: (music: MusicState | null) => ({ music }),

    addFolder: (folder: MusicFolder, id: string = uuidv4()) => ({
      folder,
      id,
    }),
    removeSource: (id: string) => ({ id }),

    jamConnected: (session: JamSession, id: string = uuidv4()) => ({
      session,
      id,
    }),
    jamSignedOut: emptyProps(),
  },
});
