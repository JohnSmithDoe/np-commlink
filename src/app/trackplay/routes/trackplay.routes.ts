import { Routes } from '@angular/router';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { trackplayContext } from '../data';

/**
 * Trackplay (game-score tracker) — one sealed domain. The empty path is the
 * program home (games list); the rest are its sub-pages, and the context on the
 * componentless subtree root registers the slice once for all of them.
 */
export const trackplayRoutes: Routes = [
  {
    path: '',
    ...trackplayContext,
    children: [
      {
        path: '',
        data: { title: marker('page-title.trackplay-games') },
        loadComponent: () =>
          import('../feature/games-page/games.page').then(
            (m) => m.TrackplayGamesPage
          ),
      },
      {
        path: 'players',
        data: { title: marker('page-title.trackplay-players') },
        loadComponent: () =>
          import('../feature/players-page/players.page').then(
            (m) => m.TrackplayPlayersPage
          ),
      },
      {
        path: 'player/:id',
        data: { title: marker('page-title.trackplay-player') },
        loadComponent: () =>
          import('../feature/player-page/player.page').then(
            (m) => m.TrackplayPlayerPage
          ),
      },
      {
        path: 'game-types',
        data: { title: marker('page-title.trackplay-game-types') },
        loadComponent: () =>
          import('../feature/game-types-page/game-types.page').then(
            (m) => m.TrackplayGameTypesPage
          ),
      },
      {
        path: 'game/:id',
        data: { title: marker('page-title.trackplay-game') },
        loadComponent: () =>
          import('../feature/game-play-page/game-play.page').then(
            (m) => m.TrackplayGamePlayPage
          ),
      },
    ],
  },
];
