import { createReducer, on } from '@ngrx/store';
import { JamSource, MusicState, Source } from '../model/music.types';
import { MusicActions } from './music.actions';

export const initialState: MusicState = {
  sources: [],
};

const isJam = (source: Source): source is JamSource => source.kind === 'jam';

const withJam = (
  state: MusicState,
  patch: (jam: JamSource | undefined) => JamSource | undefined
): MusicState => {
  const jam = patch(state.sources.find(isJam));
  const folders = state.sources.filter((source) => !isJam(source));
  return { sources: jam ? [jam, ...folders] : folders };
};

// prettier-ignore
export const musicReducer = createReducer(
  initialState,

  on(MusicActions.loaded, (state, { music }): MusicState => ({
    sources: (music ?? state).sources,
  })),

  on(MusicActions.addFolder, (state, { folder, id }): MusicState =>
    state.sources.some((source) => source.kind === 'folder' && source.uri === folder.uri)
      ? state
      : { sources: [...state.sources, { ...folder, id, kind: 'folder' }] }
  ),

  on(MusicActions.removeSource, (state, { id }): MusicState => ({
    sources: state.sources.filter((source) => source.id !== id),
  })),

  on(MusicActions.jamConnected, (state, { session, id }): MusicState =>
    withJam(state, (jam) => ({
      id: jam?.id ?? id,
      kind: 'jam',
      server: session.auth.server,
      username: session.auth.username,
      session,
    }))
  ),

  on(MusicActions.jamSignedOut, (state): MusicState =>
    withJam(state, (jam) => jam && { ...jam, session: undefined })
  )
);
