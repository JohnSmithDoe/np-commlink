import { JamSession } from '../model/music.types';
import { Action } from '@ngrx/store';
import { MusicState } from '../model/music.types';
import { MusicActions } from './music.actions';
import { initialState, musicReducer } from './music.reducer';

const session: JamSession = {
  auth: {
    server: 'http://localhost:4040',
    username: 'admin',
    session: false,
    token: 'jwt',
  },
  user: {
    id: 'u',
    name: 'admin',
    roles: { admin: true, stream: true, upload: true, podcast: true },
  },
};

const after = (...actions: Action[]): MusicState => {
  let state = initialState;
  for (const action of actions) state = musicReducer(state, action);
  return state;
};

describe('musicReducer', () => {
  it('adds a folder once, however often it is picked', () => {
    const folder = { uri: 'content://tree/music', name: 'Music' };
    const state = after(
      MusicActions.addFolder(folder, 'a'),
      MusicActions.addFolder(folder, 'b')
    );

    expect(state.sources.map((source) => source.id)).toEqual(['a']);
  });

  it('keeps the server and user when the session expires, so only the password is asked', () => {
    const state = after(
      MusicActions.jamConnected(session, 'jam'),
      MusicActions.jamSignedOut()
    );

    expect(state.sources).toEqual([
      {
        id: 'jam',
        kind: 'jam',
        server: 'http://localhost:4040',
        username: 'admin',
        session: undefined,
      },
    ]);
  });

  it('keeps the source id across a reconnect', () => {
    const state = after(
      MusicActions.jamConnected(session, 'jam'),
      MusicActions.jamSignedOut(),
      MusicActions.jamConnected(session, 'other')
    );

    expect(state.sources.map((source) => source.id)).toEqual(['jam']);
  });
});
