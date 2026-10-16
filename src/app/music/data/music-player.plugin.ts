import { InjectionToken } from '@angular/core';
import { PluginListenerHandle, registerPlugin } from '@capacitor/core';
import {
  LocalTrackTags,
  MusicFolder,
  PlayableTrack,
  PlaybackFailed,
  PlaybackState,
  RepeatMode,
} from '../model/music.types';

export type MusicPlayerPlugin = {
  pickFolder(): Promise<{ folder?: MusicFolder }>;
  releaseFolder(options: { folderUri: string }): Promise<void>;
  listTracks(options: {
    folderUri: string;
  }): Promise<{ granted: boolean; tracks: LocalTrackTags[] }>;
  cover(options: { uri: string }): Promise<{ dataUrl?: string }>;
  setAuth(options: { server?: string; token?: string }): Promise<void>;
  setQueue(options: {
    tracks: PlayableTrack[];
    startIndex: number;
  }): Promise<void>;
  append(options: { tracks: PlayableTrack[] }): Promise<void>;
  replaceUpcoming(options: { tracks: PlayableTrack[] }): Promise<void>;
  removeAt(options: { index: number }): Promise<void>;
  skipTo(options: { index: number }): Promise<void>;
  seekTo(options: { positionMs: number }): Promise<void>;
  setRepeat(options: { mode: RepeatMode }): Promise<void>;
  play(): Promise<void>;
  pause(): Promise<void>;
  next(): Promise<void>;
  previous(): Promise<void>;
  stop(): Promise<void>;
  getState(): Promise<PlaybackState>;
  addListener(
    event: 'stateChange',
    listener: (state: PlaybackState) => void
  ): Promise<PluginListenerHandle>;
  addListener(
    event: 'authRefused',
    listener: () => void
  ): Promise<PluginListenerHandle>;
  addListener(
    event: 'playbackFailed',
    listener: (failure: PlaybackFailed) => void
  ): Promise<PluginListenerHandle>;
};

export const MUSIC_PLAYER_PLUGIN = new InjectionToken<MusicPlayerPlugin>(
  'MusicPlayer plugin',
  {
    providedIn: 'root',
    factory: () => registerPlugin<MusicPlayerPlugin>('MusicPlayer'),
  }
);
