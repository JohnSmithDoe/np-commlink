import { inject, InjectionToken } from '@angular/core';
import { IS_NATIVE_PLATFORM } from '../../@shared/data/services/local-notifications.service';
import {
  PlayableTrack,
  PlaybackFailed,
  PlaybackState,
  RepeatMode,
} from '../model/music.types';
import { nextIndex, previousIndex } from '../util/queue.utils';
import { MUSIC_PLAYER_PLUGIN, MusicPlayerPlugin } from './music-player.plugin';

export type PlayerEvent =
  | { kind: 'state'; state: PlaybackState }
  | { kind: 'authRefused' }
  | ({ kind: 'failed' } & PlaybackFailed);

type MusicPlayer = {
  setQueue(tracks: PlayableTrack[], startIndex: number): Promise<void>;
  append(tracks: PlayableTrack[]): Promise<void>;
  replaceUpcoming(tracks: PlayableTrack[]): Promise<void>;
  removeAt(index: number): Promise<void>;
  skipTo(index: number): Promise<void>;
  seekTo(positionMs: number): Promise<void>;
  setRepeat(mode: RepeatMode): Promise<void>;
  setAuth(server?: string, token?: string): Promise<void>;
  setArtwork(url: string | undefined): Promise<void>;
  play(): Promise<void>;
  pause(): Promise<void>;
  next(): Promise<void>;
  previous(): Promise<void>;
  stop(): Promise<void>;
  getState(): Promise<PlaybackState>;
  listen(listener: (event: PlayerEvent) => void): void;
};

class NativeMusicPlayer implements MusicPlayer {
  constructor(private readonly plugin: MusicPlayerPlugin) {}

  setQueue(tracks: PlayableTrack[], startIndex: number): Promise<void> {
    return this.plugin.setQueue({ tracks, startIndex });
  }

  append(tracks: PlayableTrack[]): Promise<void> {
    return this.plugin.append({ tracks });
  }

  replaceUpcoming(tracks: PlayableTrack[]): Promise<void> {
    return this.plugin.replaceUpcoming({ tracks });
  }

  removeAt(index: number): Promise<void> {
    return this.plugin.removeAt({ index });
  }

  skipTo(index: number): Promise<void> {
    return this.plugin.skipTo({ index });
  }

  seekTo(positionMs: number): Promise<void> {
    return this.plugin.seekTo({ positionMs });
  }

  setRepeat(mode: RepeatMode): Promise<void> {
    return this.plugin.setRepeat({ mode });
  }

  setAuth(server?: string, token?: string): Promise<void> {
    return this.plugin.setAuth({ server, token });
  }

  setArtwork(): Promise<void> {
    return Promise.resolve();
  }

  play(): Promise<void> {
    return this.plugin.play();
  }

  pause(): Promise<void> {
    return this.plugin.pause();
  }

  next(): Promise<void> {
    return this.plugin.next();
  }

  previous(): Promise<void> {
    return this.plugin.previous();
  }

  stop(): Promise<void> {
    return this.plugin.stop();
  }

  getState(): Promise<PlaybackState> {
    return this.plugin.getState();
  }

  listen(listener: (event: PlayerEvent) => void): void {
    void this.plugin.addListener('stateChange', (state) =>
      listener({ kind: 'state', state })
    );
    void this.plugin.addListener('authRefused', () =>
      listener({ kind: 'authRefused' })
    );
    void this.plugin.addListener('playbackFailed', (failure) =>
      listener({ kind: 'failed', ...failure })
    );
  }
}

const RESTART_THRESHOLD_MS = 3000;

class WebMusicPlayer implements MusicPlayer {
  readonly #audio: HTMLAudioElement;
  readonly #listeners: ((event: PlayerEvent) => void)[] = [];
  #queue: PlayableTrack[] = [];
  #index = -1;
  #repeat: RepeatMode = 'off';

  constructor(audio: HTMLAudioElement = new Audio()) {
    this.#audio = audio;
    this.#audio.crossOrigin = 'use-credentials';
    this.#audio.preload = 'auto';
    for (const type of ['play', 'pause', 'loadedmetadata', 'timeupdate']) {
      this.#audio.addEventListener(type, () => this.#emitState());
    }
    this.#audio.addEventListener('ended', () => void this.#advance());
    this.#audio.addEventListener('error', () =>
      this.#emit({ kind: 'failed', reason: 'other' })
    );
    this.#bindMediaSession();
  }

  async setQueue(tracks: PlayableTrack[], startIndex: number): Promise<void> {
    this.#queue = [...tracks];
    await this.#load(startIndex);
  }

  async append(tracks: PlayableTrack[]): Promise<void> {
    this.#queue = [...this.#queue, ...tracks];
    if (this.#index < 0) await this.#load(0);
    else this.#emitState();
  }

  replaceUpcoming(tracks: PlayableTrack[]): Promise<void> {
    this.#queue = [...this.#queue.slice(0, this.#index + 1), ...tracks];
    this.#emitState();
    return Promise.resolve();
  }

  async removeAt(index: number): Promise<void> {
    if (index < 0 || index >= this.#queue.length) return;
    this.#queue = this.#queue.filter((_, index_) => index_ !== index);
    if (index < this.#index) this.#index--;
    else if (index === this.#index) {
      await (this.#index < this.#queue.length
        ? this.#load(this.#index)
        : this.stop());
      return;
    }
    this.#emitState();
  }

  skipTo(index: number): Promise<void> {
    return this.#load(index);
  }

  seekTo(positionMs: number): Promise<void> {
    this.#audio.currentTime = positionMs / 1000;
    return Promise.resolve();
  }

  setRepeat(mode: RepeatMode): Promise<void> {
    this.#repeat = mode;
    return Promise.resolve();
  }

  setAuth(): Promise<void> {
    return Promise.resolve();
  }

  setArtwork(url: string | undefined): Promise<void> {
    const metadata =
      'mediaSession' in navigator ? navigator.mediaSession.metadata : null;
    if (metadata)
      metadata.artwork = url ? [{ src: url, sizes: '300x300' }] : [];
    return Promise.resolve();
  }

  play(): Promise<void> {
    return this.#audio
      .play()
      .catch(() => this.#emit({ kind: 'failed', reason: 'other' }));
  }

  pause(): Promise<void> {
    this.#audio.pause();
    return Promise.resolve();
  }

  async next(): Promise<void> {
    const index = nextIndex(this.#index, this.#queue.length, 'all');
    if (index !== undefined) await this.#load(index);
  }

  async previous(): Promise<void> {
    if (this.#audio.currentTime * 1000 > RESTART_THRESHOLD_MS) {
      this.#audio.currentTime = 0;
      return;
    }
    await this.#load(previousIndex(this.#index));
  }

  stop(): Promise<void> {
    this.#audio.pause();
    this.#audio.removeAttribute('src');
    this.#audio.load();
    this.#index = -1;
    this.#emitState();
    return Promise.resolve();
  }

  getState(): Promise<PlaybackState> {
    return Promise.resolve(this.#state());
  }

  listen(listener: (event: PlayerEvent) => void): void {
    this.#listeners.push(listener);
  }

  async #advance(): Promise<void> {
    const index = nextIndex(this.#index, this.#queue.length, this.#repeat);
    if (index === undefined) {
      this.#emitState();
      return;
    }
    await this.#load(index);
  }

  async #load(index: number): Promise<void> {
    const track = this.#queue[index];
    if (!track) return;
    this.#index = index;
    this.#audio.src = track.uri;
    this.#describe(track);
    await this.play();
  }

  #state(): PlaybackState {
    const duration = this.#audio.duration;
    return {
      playing: !this.#audio.paused && !this.#audio.ended,
      entryId: this.#queue[this.#index]?.entryId,
      positionMs: Math.round(this.#audio.currentTime * 1000),
      durationMs: Number.isFinite(duration)
        ? Math.round(duration * 1000)
        : undefined,
    };
  }

  #emitState(): void {
    const state = this.#state();
    this.#emit({ kind: 'state', state });
    this.#reportPosition(state);
  }

  #emit(event: PlayerEvent): void {
    for (const listener of this.#listeners) listener(event);
  }

  #describe(track: PlayableTrack): void {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: track.artist ?? '',
      album: track.album ?? '',
      artwork: track.artworkUri
        ? [{ src: track.artworkUri, sizes: '300x300' }]
        : [],
    });
  }

  #reportPosition(state: PlaybackState): void {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.playbackState = state.playing ? 'playing' : 'paused';
    if (state.durationMs === undefined || state.positionMs === undefined)
      return;
    navigator.mediaSession.setPositionState({
      duration: state.durationMs / 1000,
      position: Math.min(state.positionMs, state.durationMs) / 1000,
      playbackRate: this.#audio.playbackRate,
    });
  }

  #bindMediaSession(): void {
    if (!('mediaSession' in navigator)) return;
    const session = navigator.mediaSession;
    session.setActionHandler('play', () => void this.play());
    session.setActionHandler('pause', () => void this.pause());
    session.setActionHandler('previoustrack', () => void this.previous());
    session.setActionHandler('nexttrack', () => void this.next());
    session.setActionHandler('seekto', (details) => {
      if (details.seekTime !== undefined)
        void this.seekTo(details.seekTime * 1000);
    });
  }
}

export const MUSIC_PLAYER = new InjectionToken<MusicPlayer>('Music player', {
  providedIn: 'root',
  factory: () =>
    inject(IS_NATIVE_PLATFORM)
      ? new NativeMusicPlayer(inject(MUSIC_PLAYER_PLUGIN))
      : new WebMusicPlayer(),
});
