import { computed, inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { IS_NATIVE_PLATFORM } from '../../@shared/data/services/local-notifications.service';
import { ConnectOutcome, JamConnection, Source } from '../model/music.types';
import { JamGateway } from './jam.gateway';
import { LocalLibraryStore } from './local-library.store';
import { MusicActions } from './music.actions';
import { MUSIC_PLAYER_PLUGIN } from './music-player.plugin';
import { selectFolderSources } from './music.selector';

@Injectable()
export class SourcesFacade {
  readonly #store = inject(Store);
  readonly #plugin = inject(MUSIC_PLAYER_PLUGIN);
  readonly #jam = inject(JamGateway);
  readonly #local = inject(LocalLibraryStore);

  readonly foldersSupported = inject(IS_NATIVE_PLATFORM);
  readonly jam = this.#jam.source;
  readonly connected = this.#jam.connected;
  readonly needsPassword = computed(
    () => !!this.#jam.source() && !this.#jam.connected()
  );
  readonly folders = this.#store.selectSignal(selectFolderSources);
  readonly scanning = this.#local.scanning;
  readonly lostSourceIds = computed(
    (): ReadonlySet<string> =>
      new Set(
        this.#local
          .scans()
          .filter((scan) => !scan.granted)
          .map((scan) => scan.source.id)
      )
  );
  readonly trackCounts = computed(
    (): ReadonlyMap<string, number> =>
      new Map(
        this.#local.scans().map((scan) => [scan.source.id, scan.tracks.length])
      )
  );

  connect(connection: JamConnection): Promise<ConnectOutcome> {
    return this.#jam.connect(connection);
  }

  signOut(): Promise<void> {
    return this.#jam.signOut();
  }

  async addFolder(): Promise<void> {
    const { folder } = await this.#plugin.pickFolder();
    if (folder) this.#store.dispatch(MusicActions.addFolder(folder));
  }

  async removeSource(source: Source): Promise<void> {
    await (source.kind === 'folder'
      ? this.#plugin.releaseFolder({ folderUri: source.uri })
      : this.#jam.signOut());
    this.#store.dispatch(MusicActions.removeSource(source.id));
    if (source.kind === 'folder') await this.#local.forget(source.id);
  }

  rescan(): Promise<void> {
    return this.#local.rescan();
  }
}
