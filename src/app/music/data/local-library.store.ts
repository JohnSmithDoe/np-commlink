import { computed, effect, inject, signal, Service } from '@angular/core';
import { Store } from '@ngrx/store';
import { DatabaseService } from '../../@shared/data/persistence/database.service';
import { IS_NATIVE_PLATFORM } from '../../@shared/data/services/local-notifications.service';
import {
  FolderScan,
  FolderSnapshot,
  FolderSource,
  Track,
} from '../model/music.types';
import { toLocalTrack } from '../util/local.mapper';
import { MUSIC_PLAYER_PLUGIN } from './music-player.plugin';
import { selectFolderSources } from './music.selector';

export const FOLDER_SNAPSHOT_KEY_PREFIX = 'music-folder:';

const keyOf = (sourceId: string): string =>
  `${FOLDER_SNAPSHOT_KEY_PREFIX}${sourceId}`;

const toScan = (
  source: FolderSource,
  snapshot: FolderSnapshot
): FolderScan => ({
  source,
  granted: snapshot.granted,
  tracks: (snapshot.granted ? snapshot.tracks : [])
    .filter((tags) => !snapshot.missing.includes(tags.uri))
    .map((tags) => toLocalTrack(source, tags)),
});

const without = (ids: ReadonlySet<string>, id: string): Set<string> => {
  const next = new Set(ids);
  next.delete(id);
  return next;
};

@Service({ autoProvided: false })
export class LocalLibraryStore {
  readonly #plugin = inject(MUSIC_PLAYER_PLUGIN);
  readonly #database = inject(DatabaseService);
  readonly #folders = inject(Store).selectSignal(selectFolderSources);
  readonly #snapshots = signal<Record<string, FolderSnapshot> | undefined>(
    undefined
  );
  readonly #scanningIds = signal<ReadonlySet<string>>(new Set());
  readonly #unreadIds = new Set<string>();

  readonly scanning = computed(
    () => this.#snapshots() === undefined || this.#scanningIds().size > 0
  );
  readonly scans = computed((): FolderScan[] => {
    const snapshots = this.#snapshots() ?? {};
    return this.#folders().flatMap((source) => {
      const snapshot = snapshots[source.id];
      return snapshot ? [toScan(source, snapshot)] : [];
    });
  });
  readonly tracks = computed((): Track[] =>
    this.scans().flatMap((scan) => scan.tracks)
  );

  constructor() {
    if (!inject(IS_NATIVE_PLATFORM)) {
      this.#snapshots.set({});
      return;
    }
    void this.#hydrate();
    effect(() => this.#reconcile(this.#folders(), this.#snapshots()));
  }

  async rescan(): Promise<void> {
    const scanning = this.#scanningIds();
    await Promise.all(
      this.#folders()
        .filter((source) => !scanning.has(source.id))
        .map((source) => this.#scan(source))
    );
  }

  async markMissing(sourceId: string, uri: string): Promise<void> {
    await this.#amend(sourceId, (snapshot) =>
      snapshot.missing.includes(uri)
        ? snapshot
        : { ...snapshot, missing: [...snapshot.missing, uri] }
    );
  }

  async markLost(sourceId: string): Promise<void> {
    await this.#amend(sourceId, (snapshot) => ({
      ...snapshot,
      granted: false,
    }));
  }

  async forget(sourceId: string): Promise<void> {
    this.#snapshots.update((snapshots) =>
      Object.fromEntries(
        Object.entries(snapshots ?? {}).filter(([id]) => id !== sourceId)
      )
    );
    await this.#database.remove(keyOf(sourceId));
  }

  async #hydrate(): Promise<void> {
    const stored = await this.#database
      .loadPrefixed<FolderSnapshot>(FOLDER_SNAPSHOT_KEY_PREFIX)
      .catch((): FolderSnapshot[] => []);
    this.#snapshots.set(
      Object.fromEntries(
        stored.map((snapshot) => [snapshot.sourceId, snapshot])
      )
    );
  }

  #reconcile(
    folders: FolderSource[],
    snapshots: Record<string, FolderSnapshot> | undefined
  ): void {
    if (!snapshots) return;
    const scanning = this.#scanningIds();
    for (const source of folders) {
      const settled =
        snapshots[source.id] ||
        scanning.has(source.id) ||
        this.#unreadIds.has(source.id);
      if (!settled) void this.#scan(source);
    }
  }

  async #scan(source: FolderSource): Promise<void> {
    this.#scanningIds.update((ids) => new Set(ids).add(source.id));
    try {
      const { granted, tracks } = await this.#plugin.listTracks({
        folderUri: source.uri,
      });
      this.#unreadIds.delete(source.id);
      await this.#put({ sourceId: source.id, granted, tracks, missing: [] });
    } catch {
      this.#unreadIds.add(source.id);
    } finally {
      this.#scanningIds.update((ids) => without(ids, source.id));
    }
  }

  async #amend(
    sourceId: string,
    change: (snapshot: FolderSnapshot) => FolderSnapshot
  ): Promise<void> {
    const snapshot = this.#snapshots()?.[sourceId];
    const changed = snapshot && change(snapshot);
    if (changed && changed !== snapshot) await this.#put(changed);
  }

  async #put(snapshot: FolderSnapshot): Promise<void> {
    this.#snapshots.update((snapshots) => ({
      ...snapshots,
      [snapshot.sourceId]: snapshot,
    }));
    await this.#database.save(keyOf(snapshot.sourceId), snapshot);
  }
}
