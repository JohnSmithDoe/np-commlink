import { computed, inject, Injectable, signal } from '@angular/core';
import { IS_NATIVE_PLATFORM } from '../../@shared/data/services/local-notifications.service';
import { MusicFolder, PlaybackState, Track } from '../model/music.types';
import { MUSIC_PLAYER } from './music-player.plugin';

@Injectable({ providedIn: 'root' })
export class MusicFacade {
  readonly #player = inject(MUSIC_PLAYER);
  readonly #folder = signal<MusicFolder | undefined>(undefined);
  readonly #tracks = signal<Track[]>([]);
  readonly #playback = signal<PlaybackState>({ playing: false });

  readonly supported = inject(IS_NATIVE_PLATFORM);
  readonly folder = this.#folder.asReadonly();
  readonly tracks = this.#tracks.asReadonly();
  readonly playing = computed(() => this.#playback().playing);
  readonly current = computed(() =>
    this.#tracks().find((track) => track.uri === this.#playback().trackUri)
  );

  constructor() {
    if (!this.supported) return;
    void this.#player.addListener('stateChange', (state) =>
      this.#playback.set(state)
    );
    void this.#restore();
  }

  async pickFolder(): Promise<void> {
    const { folder } = await this.#player.pickFolder();
    if (!folder) return;
    this.#folder.set(folder);
    await this.#loadTracks();
  }

  playAt(track: Track): Promise<void> {
    const tracks = this.#tracks();
    return this.#player.setQueue({
      tracks,
      startIndex: tracks.indexOf(track),
    });
  }

  togglePlay(): Promise<void> {
    if (this.playing()) return this.#player.pause();
    return this.current() ? this.#player.play() : this.#playFirst();
  }

  next(): Promise<void> {
    return this.#player.next();
  }

  previous(): Promise<void> {
    return this.#player.previous();
  }

  async #restore(): Promise<void> {
    const [{ folder }, playback] = await Promise.all([
      this.#player.getFolder(),
      this.#player.getState(),
    ]);
    this.#playback.set(playback);
    this.#folder.set(folder);
    if (folder) await this.#loadTracks();
  }

  async #loadTracks(): Promise<void> {
    const { tracks } = await this.#player.listTracks();
    this.#tracks.set(tracks);
  }

  async #playFirst(): Promise<void> {
    const [first] = this.#tracks();
    if (first) await this.playAt(first);
  }
}
