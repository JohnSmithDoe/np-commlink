import { computed, inject, Injectable, resource } from '@angular/core';
import { Store } from '@ngrx/store';
import { IS_NATIVE_PLATFORM } from '../../@shared/data/services/local-notifications.service';
import { FolderScan, FolderSource, Track } from '../model/music.types';
import { toLocalTrack } from '../util/local.mapper';
import { MUSIC_PLAYER_PLUGIN, MusicPlayerPlugin } from './music-player.plugin';
import { selectFolderSources } from './music.selector';

const scanFolder = async (
  plugin: MusicPlayerPlugin,
  source: FolderSource
): Promise<FolderScan> => {
  const { granted, tracks } = await plugin.listTracks({
    folderUri: source.uri,
  });
  return {
    source,
    granted,
    tracks: tracks.map((tags) => toLocalTrack(source, tags)),
  };
};

@Injectable()
export class LocalLibraryStore {
  readonly #plugin = inject(MUSIC_PLAYER_PLUGIN);
  readonly #native = inject(IS_NATIVE_PLATFORM);
  readonly #folders = inject(Store).selectSignal(selectFolderSources);
  readonly #scans = resource({
    params: () => (this.#native ? this.#folders() : []),
    loader: ({ params }) =>
      Promise.all(params.map((source) => scanFolder(this.#plugin, source))),
  });

  readonly scanning = this.#scans.isLoading;
  readonly scans = computed((): FolderScan[] =>
    this.#scans.hasValue() ? this.#scans.value() : []
  );
  readonly tracks = computed((): Track[] =>
    this.scans().flatMap((scan) => scan.tracks)
  );

  reload(): void {
    this.#scans.reload();
  }
}
