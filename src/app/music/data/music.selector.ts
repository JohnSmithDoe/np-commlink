import { createFeatureSelector, createSelector } from '@ngrx/store';
import {
  FolderSource,
  JamSource,
  MusicState,
  Source,
} from '../model/music.types';

export const MUSIC_STATE_KEY = 'music';

export const selectMusicState =
  createFeatureSelector<MusicState>(MUSIC_STATE_KEY);

const selectSources = createSelector(
  selectMusicState,
  (state): Source[] => state?.sources ?? []
);

export const selectFolderSources = createSelector(
  selectSources,
  (sources): FolderSource[] =>
    sources.filter((source): source is FolderSource => source.kind === 'folder')
);

export const selectJamSource = createSelector(
  selectSources,
  (sources): JamSource | undefined =>
    sources.find((source): source is JamSource => source.kind === 'jam')
);
