export type Track = {
  uri: string;
  title: string;
  path: string;
};

export type MusicFolder = {
  uri: string;
  name: string;
};

export type PlaybackState = {
  playing: boolean;
  trackUri?: string;
};
