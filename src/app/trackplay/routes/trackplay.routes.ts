import { Routes } from '@angular/router';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { trackplayContext } from '../data';

export const trackplayRoutes: Routes = [
  {
    path: '',
    ...trackplayContext,
    children: [
      {
        path: '',
        title: marker('page-title.trackplay-games'),
        loadComponent: () =>
          import('../feature/games-page/games.page').then(
            (m) => m.TrackplayGamesPage
          ),
      },
      {
        path: 'players',
        title: marker('page-title.trackplay-players'),
        loadComponent: () =>
          import('../feature/players-page/players.page').then(
            (m) => m.TrackplayPlayersPage
          ),
      },
      {
        path: 'player/:id',
        title: marker('page-title.trackplay-player'),
        loadComponent: () =>
          import('../feature/player-page/player.page').then(
            (m) => m.TrackplayPlayerPage
          ),
      },
      {
        path: 'game-types',
        title: marker('page-title.trackplay-game-types'),
        loadComponent: () =>
          import('../feature/game-types-page/game-types.page').then(
            (m) => m.TrackplayGameTypesPage
          ),
      },
      {
        path: 'dice',
        title: marker('page-title.trackplay-dice'),
        loadComponent: () =>
          import('../feature/dice-page/dice.page').then(
            (m) => m.TrackplayDicePage
          ),
      },
      {
        path: 'board',
        title: marker('page-title.trackplay-board'),
        loadComponent: () =>
          import('../feature/board-page/board.page').then(
            (m) => m.TrackplayBoardPage
          ),
      },
      {
        path: 'board/rules',
        title: marker('page-title.trackplay-board-rules'),
        loadComponent: () =>
          import('../feature/board-rules-page/board-rules.page').then(
            (m) => m.TrackplayBoardRulesPage
          ),
      },
      {
        path: 'game/:id',
        title: marker('page-title.trackplay-game'),
        loadComponent: () =>
          import('../feature/game-play-page/game-play.page').then(
            (m) => m.TrackplayGamePlayPage
          ),
      },
    ],
  },
];
