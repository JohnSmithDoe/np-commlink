import {
  computed,
  DestroyRef,
  effect,
  inject,
  Injectable,
  signal,
} from '@angular/core';
import { IS_NATIVE_PLATFORM } from '../../@shared/data/services/local-notifications.service';
import { POSITION_POLL_MS } from '../model/music.consts';
import {
  PlayableTrack,
  PlaybackState,
  QueueEntry,
  RepeatMode,
  Track,
} from '../model/music.types';
import { shuffled, toQueue, withoutEntry } from '../util/queue.utils';
import { CoverStore } from './cover.store';
import { JamGateway } from './jam.gateway';
import { MUSIC_PLAYER, PlayerEvent } from './music-player';

const REPEAT_CYCLE: Record<RepeatMode, RepeatMode> = {
  off: 'all',
  all: 'one',
  one: 'off',
};

@Injectable()
export class PlayerFacade {
  readonly #player = inject(MUSIC_PLAYER);
  readonly #jam = inject(JamGateway);
  readonly #covers = inject(CoverStore);
  readonly #native = inject(IS_NATIVE_PLATFORM);
  readonly #queue = signal<QueueEntry[]>([]);
  readonly #playback = signal<PlaybackState>({ playing: false });
  readonly #repeat = signal<RepeatMode>('off');
  #announced: string | undefined;

  readonly queue = this.#queue.asReadonly();
  readonly repeat = this.#repeat.asReadonly();
  readonly playing = computed(() => this.#playback().playing);
  readonly positionMs = computed(() => this.#playback().positionMs ?? 0);
  readonly durationMs = computed(
    () => this.#playback().durationMs ?? this.current()?.track.durationMs
  );
  readonly current = computed(() =>
    this.#queue().find((entry) => entry.entryId === this.#playback().entryId)
  );
  readonly currentIndex = computed(() => {
    const current = this.current();
    return current ? this.#queue().indexOf(current) : -1;
  });

  constructor() {
    this.#player.listen((event) => void this.#handle(event));
    void this.#player.getState().then((state) => this.#playback.set(state));
    effect(() => {
      const auth = this.#jam.source()?.session?.auth;
      void this.#player.setAuth(auth?.server, auth?.token);
    });
    effect(() => {
      const entry = this.current();
      if (entry) void this.#started(entry);
    });
    if (this.#native) this.#pollPosition();
  }

  play(
    tracks: readonly Track[],
    start: Track = tracks[0] as Track
  ): Promise<void> {
    const queue = toQueue(tracks);
    this.#queue.set(queue);
    return this.#player.setQueue(
      queue.map((entry) => this.#playable(entry)),
      Math.max(0, tracks.indexOf(start))
    );
  }

  enqueue(tracks: readonly Track[]): Promise<void> {
    const added = toQueue(tracks);
    this.#queue.update((queue) => [...queue, ...added]);
    return this.#player.append(added.map((entry) => this.#playable(entry)));
  }

  skipTo(entry: QueueEntry): Promise<void> {
    return this.#player.skipTo(this.#queue().indexOf(entry));
  }

  remove(entry: QueueEntry): Promise<void> {
    const index = this.#queue().indexOf(entry);
    this.#queue.update((queue) => withoutEntry(queue, entry.entryId));
    return this.#player.removeAt(index);
  }

  shuffleUpcoming(): Promise<void> {
    const split = this.currentIndex() + 1;
    const upcoming = shuffled(this.#queue().slice(split));
    this.#queue.update((queue) => [...queue.slice(0, split), ...upcoming]);
    return this.#player.replaceUpcoming(
      upcoming.map((entry) => this.#playable(entry))
    );
  }

  cycleRepeat(): Promise<void> {
    const next = REPEAT_CYCLE[this.#repeat()];
    this.#repeat.set(next);
    return this.#player.setRepeat(next);
  }

  togglePlay(): Promise<void> {
    if (this.playing()) return this.#player.pause();
    if (this.current()) return this.#player.play();
    const [first] = this.#queue();
    return first ? this.skipTo(first) : Promise.resolve();
  }

  next(): Promise<void> {
    return this.#player.next();
  }

  previous(): Promise<void> {
    return this.#player.previous();
  }

  seek(positionMs: number): Promise<void> {
    this.#playback.update((state) => ({ ...state, positionMs }));
    return this.#player.seekTo(positionMs);
  }

  async #handle(event: PlayerEvent): Promise<void> {
    if (event.kind === 'state') {
      this.#playback.set(event.state);
      return;
    }
    if (event.kind === 'authRefused') {
      await this.#jam.expire();
      return;
    }
    if (this.current()?.track.onDevice === false) {
      await this.#jam.verify().catch(() => {});
      if (!this.#jam.connected()) await this.#player.stop();
    }
  }

  #playable({ entryId, track }: QueueEntry): PlayableTrack {
    return {
      entryId,
      uri: track.uri,
      title: track.title,
      artist: track.artist,
      album: track.album,
      artworkUri:
        this.#native && track.cover?.kind === 'jam'
          ? this.#jam.imageUrl(track.cover.id, 300)
          : undefined,
    };
  }

  async #started({ entryId, track }: QueueEntry): Promise<void> {
    if (this.#announced === entryId) return;
    this.#announced = entryId;
    if (!this.#native && track.cover)
      await this.#player.setArtwork(await this.#covers.load(track.cover));
    if (!track.onDevice) await this.#jam.scrobble(track.id).catch(() => {});
  }

  #pollPosition(): void {
    const timer = setInterval(() => {
      if (this.playing())
        void this.#player.getState().then((state) => this.#playback.set(state));
    }, POSITION_POLL_MS);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }
}
