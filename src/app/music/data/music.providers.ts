import { providePersistedContext } from '../../@shared/data/persisted-states/persisted-context.provider';
import { MusicActions } from './music.actions';
import { musicReducer } from './music.reducer';
import { MUSIC_STATE_KEY, selectMusicState } from './music.selector';

export const musicContext = providePersistedContext({
  key: MUSIC_STATE_KEY,
  reducer: musicReducer,
  lifecycle: MusicActions,
  select: selectMusicState,
  save: {
    on: [
      MusicActions.addFolder,
      MusicActions.removeSource,
      MusicActions.jamConnected,
      MusicActions.jamSignedOut,
    ],
  },
});
