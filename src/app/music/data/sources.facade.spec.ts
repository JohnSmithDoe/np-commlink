import { TestBed } from '@angular/core/testing';
import { MockStore } from '@ngrx/store/testing';
import { NATIVE_PLATFORM } from '../../@shared/data/services/local-notifications.service';
import { provideTestingProviders } from '../../@shared/testing/test-providers';
import { FolderSource } from '../model/music.types';
import {
  fakeJamGateway,
  fakeLocalLibrary,
  mockJamSource,
  mockTrack,
} from '../testing/music.fakes';
import { JamGateway } from './jam.gateway';
import { LocalLibraryStore } from './local-library.store';
import { MusicActions } from './music.actions';
import { MUSIC_PLAYER_PLUGIN } from './music-player.plugin';
import { SourcesFacade } from './sources.facade';

const folder: FolderSource = {
  id: 'folder-1',
  kind: 'folder',
  uri: 'content://music',
  name: 'Music',
};
const lost: FolderSource = { ...folder, id: 'folder-2', uri: 'content://old' };

const firstCall = (mock: { mock: { invocationCallOrder: number[] } }) =>
  mock.mock.invocationCallOrder[0];

const setup = () => {
  const gateway = fakeJamGateway();
  const local = {
    ...fakeLocalLibrary([
      { source: folder, granted: true, tracks: [mockTrack(), mockTrack()] },
      { source: lost, granted: false, tracks: [] },
    ]),
    rescan: vi.fn(() => Promise.resolve()),
  };
  const plugin = {
    pickFolder: vi.fn(() =>
      Promise.resolve({ folder: { uri: 'content://new', name: 'New' } })
    ),
    releaseFolder: vi.fn(() => Promise.resolve()),
  };
  const signOut = vi.fn(() => Promise.resolve());
  TestBed.configureTestingModule({
    providers: [
      provideTestingProviders({ music: { sources: [folder, lost] } }),
      SourcesFacade,
      { provide: JamGateway, useValue: { ...gateway, signOut } },
      { provide: LocalLibraryStore, useValue: local },
      { provide: MUSIC_PLAYER_PLUGIN, useValue: plugin },
      { provide: NATIVE_PLATFORM, useValue: true },
    ],
  });
  const dispatch = vi.spyOn(TestBed.inject(MockStore), 'dispatch');
  return {
    facade: TestBed.inject(SourcesFacade),
    gateway,
    local,
    plugin,
    signOut,
    dispatch,
  };
};

describe('SourcesFacade', () => {
  it('counts tracks per folder and names the ones whose grant is gone', () => {
    const { facade } = setup();

    expect(facade.trackCounts().get('folder-1')).toBe(2);
    expect([...facade.lostSourceIds()]).toEqual(['folder-2']);
    expect(facade.folders()).toHaveLength(2);
  });

  it('asks for the password alone once a kept server lost its session', () => {
    const { facade, gateway } = setup();
    expect(facade.needsPassword()).toBe(false);

    gateway.source.set(mockJamSource(false));

    expect(facade.needsPassword()).toBe(true);
  });

  it('stores the folder the picker returns, and nothing on cancel', async () => {
    const { facade, plugin, dispatch } = setup();

    await facade.addFolder();
    plugin.pickFolder.mockResolvedValueOnce({ folder: undefined } as never);
    await facade.addFolder();

    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: MusicActions.addFolder({ uri: '', name: '' }).type,
        folder: { uri: 'content://new', name: 'New' },
      })
    );
  });

  it('releases a folder’s grant, and signs a server out, before removing it', async () => {
    const { facade, plugin, signOut, dispatch, local } = setup();

    await facade.removeSource(folder);

    expect(plugin.releaseFolder).toHaveBeenCalledWith({
      folderUri: 'content://music',
    });
    expect(dispatch).toHaveBeenCalledExactlyOnceWith(
      MusicActions.removeSource('folder-1')
    );
    expect(firstCall(plugin.releaseFolder)).toBeLessThan(firstCall(dispatch));
    expect(local.forget).toHaveBeenCalledExactlyOnceWith('folder-1');

    dispatch.mockClear();
    await facade.removeSource(mockJamSource());

    expect(signOut).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledExactlyOnceWith(
      MusicActions.removeSource('jam-1')
    );
    expect(firstCall(signOut)).toBeLessThan(firstCall(dispatch));
  });

  it('rescans through the local library', async () => {
    const { facade, local } = setup();

    await facade.rescan();

    expect(local.rescan).toHaveBeenCalled();
  });
});
