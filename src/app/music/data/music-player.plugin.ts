import { InjectionToken } from '@angular/core';
import { PluginListenerHandle, registerPlugin } from '@capacitor/core';
import { MusicFolder, PlaybackState, Track } from '../model/music.types';

export type MusicPlayerPlugin = {
  pickFolder(): Promise<{ folder?: MusicFolder }>;
  getFolder(): Promise<{ folder?: MusicFolder }>;
  listTracks(): Promise<{ tracks: Track[] }>;
  setQueue(options: { tracks: Track[]; startIndex: number }): Promise<void>;
  play(): Promise<void>;
  pause(): Promise<void>;
  next(): Promise<void>;
  previous(): Promise<void>;
  getState(): Promise<PlaybackState>;
  addListener(
    event: 'stateChange',
    listener: (state: PlaybackState) => void
  ): Promise<PluginListenerHandle>;
};

export const MUSIC_PLAYER = new InjectionToken<MusicPlayerPlugin>(
  'MusicPlayer plugin',
  {
    providedIn: 'root',
    factory: () => registerPlugin<MusicPlayerPlugin>('MusicPlayer'),
  }
);
