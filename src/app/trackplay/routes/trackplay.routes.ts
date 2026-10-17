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
        redirectTo: 'games',
        pathMatch: 'full',
      },
      {
        path: '',
        loadComponent: async () => {
          const { ModuleTabsPage } =
            await import('../../@shared/feature/module-tabs-page/module-tabs.page');
          return ModuleTabsPage;
        },
        children: [
          {
            path: 'players',
            children: [
              {
                path: '',
                title: marker('page-title.trackplay-players'),
                loadComponent: async () => {
                  const { TrackplayPlayersPage } =
                    await import('../feature/players-page/players.page');
                  return TrackplayPlayersPage;
                },
              },
              {
                path: ':id',
                title: marker('page-title.trackplay-player'),
                loadComponent: async () => {
                  const { TrackplayPlayerPage } =
                    await import('../feature/player-page/player.page');
                  return TrackplayPlayerPage;
                },
              },
            ],
          },
          {
            path: 'games',
            children: [
              {
                path: '',
                title: marker('page-title.trackplay-games'),
                loadComponent: async () => {
                  const { TrackplayGamesPage } =
                    await import('../feature/games-page/games.page');
                  return TrackplayGamesPage;
                },
              },
              {
                path: 'types',
                title: marker('page-title.trackplay-game-types'),
                loadComponent: async () => {
                  const { TrackplayGameTypesPage } =
                    await import('../feature/game-types-page/game-types.page');
                  return TrackplayGameTypesPage;
                },
              },
              {
                path: ':id',
                title: marker('page-title.trackplay-game'),
                loadComponent: async () => {
                  const { TrackplayGamePlayPage } =
                    await import('../feature/game-play-page/game-play.page');
                  return TrackplayGamePlayPage;
                },
              },
            ],
          },
          {
            path: 'dice',
            title: marker('page-title.trackplay-dice'),
            loadComponent: async () => {
              const { TrackplayDicePage } =
                await import('../feature/dice-page/dice.page');
              return TrackplayDicePage;
            },
          },
          {
            path: 'board',
            children: [
              {
                path: '',
                title: marker('page-title.trackplay-board'),
                loadComponent: async () => {
                  const { TrackplayBoardPage } =
                    await import('../feature/board-page/board.page');
                  return TrackplayBoardPage;
                },
              },
              {
                path: 'rules',
                title: marker('page-title.trackplay-board-rules'),
                loadComponent: async () => {
                  const { TrackplayBoardRulesPage } =
                    await import('../feature/board-rules-page/board-rules.page');
                  return TrackplayBoardRulesPage;
                },
              },
            ],
          },
        ],
      },
    ],
  },
];
