import { TestBed } from '@angular/core/testing';
import { IS_NATIVE_PLATFORM } from '../../@shared/data/services/local-notifications.service';
import { provideTestingProviders } from '../../@shared/testing/test-providers';
import { FolderSource } from '../model/music.types';
import { LocalLibraryStore } from './local-library.store';
import { MUSIC_PLAYER_PLUGIN } from './music-player.plugin';

const music: FolderSource = {
  id: 'folder-1',
  kind: 'folder',
  uri: 'content://music',
  name: 'Music',
};
const old: FolderSource = { ...music, id: 'folder-2', uri: 'content://old' };

const plugin = {
  listTracks: vi.fn(({ folderUri }: { folderUri: string }) =>
    Promise.resolve(
      folderUri === music.uri
        ? {
            granted: true,
            tracks: [
              {
                uri: 'content://music/roads.mp3',
                path: 'roads.mp3',
                title: 'Roads',
                artist: 'Portishead',
                album: 'Dummy',
              },
            ],
          }
        : { granted: false, tracks: [] }
    )
  ),
};

function setup(native: boolean): LocalLibraryStore {
  TestBed.configureTestingModule({
    providers: [
      provideTestingProviders({ music: { sources: [music, old] } }),
      LocalLibraryStore,
      { provide: MUSIC_PLAYER_PLUGIN, useValue: plugin },
      { provide: IS_NATIVE_PLATFORM, useValue: native },
    ],
  });
  return TestBed.inject(LocalLibraryStore);
}

describe('LocalLibraryStore', () => {
  beforeEach(() => {
    plugin.listTracks.mockClear();
  });

  it('scans every folder and keeps the ones whose grant is gone', async () => {
    const store = setup(true);
    TestBed.tick();

    await vi.waitFor(() => expect(store.scans()).toHaveLength(2));
    expect(store.scans().map((scan) => scan.granted)).toEqual([true, false]);
    expect(store.tracks()).toEqual([
      expect.objectContaining({
        id: 'content://music/roads.mp3',
        sourceId: 'folder-1',
        title: 'Roads',
        onDevice: true,
        cover: { kind: 'local', uri: 'content://music/roads.mp3' },
      }),
    ]);
  });

  it('rescans on request', async () => {
    const store = setup(true);
    TestBed.tick();
    await vi.waitFor(() => expect(store.scanning()).toBe(false));

    store.reload();
    TestBed.tick();

    await vi.waitFor(() => expect(plugin.listTracks).toHaveBeenCalledTimes(4));
  });

  it('reads no folders in the browser', async () => {
    const store = setup(false);
    TestBed.tick();

    await vi.waitFor(() => expect(store.scanning()).toBe(false));
    expect(store.tracks()).toEqual([]);
    expect(plugin.listTracks).not.toHaveBeenCalled();
  });
});
