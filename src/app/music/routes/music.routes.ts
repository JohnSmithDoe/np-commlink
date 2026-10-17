import { Routes } from '@angular/router';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import {
  CoverStore,
  JamGateway,
  LibraryFacade,
  LocalLibraryStore,
  musicContext,
  PlayerFacade,
  SourcesFacade,
} from '../data';

const detailRoutes: Routes = [
  {
    path: 'artist/:key',
    title: marker('page-title.music-artist'),
    loadComponent: async () => {
      const { MusicArtistPage } =
        await import('../feature/artist-page/artist.page');
      return MusicArtistPage;
    },
  },
  {
    path: 'album/:key',
    title: marker('page-title.music-album'),
    loadComponent: async () => {
      const { MusicAlbumPage } =
        await import('../feature/album-page/album.page');
      return MusicAlbumPage;
    },
  },
  {
    path: 'folder/:id',
    title: marker('page-title.music-folder'),
    loadComponent: async () => {
      const { MusicFolderPage } =
        await import('../feature/folder-page/folder.page');
      return MusicFolderPage;
    },
  },
];

export const musicRoutes: Routes = [
  {
    path: '',
    providers: [
      ...musicContext.providers,
      JamGateway,
      LocalLibraryStore,
      CoverStore,
      LibraryFacade,
      PlayerFacade,
      SourcesFacade,
    ],
    resolve: musicContext.resolve,
    children: [
      {
        path: '',
        redirectTo: 'home',
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
            path: 'home',
            data: { musicTab: '/music/home' },
            children: [
              {
                path: '',
                title: marker('page-title.music-home'),
                loadComponent: async () => {
                  const { MusicHomePage } =
                    await import('../feature/home-page/home.page');
                  return MusicHomePage;
                },
              },
              {
                path: 'playlist/:id',
                title: marker('page-title.music-playlist'),
                loadComponent: async () => {
                  const { MusicPlaylistPage } =
                    await import('../feature/playlist-page/playlist.page');
                  return MusicPlaylistPage;
                },
              },
              {
                path: 'favorites',
                title: marker('page-title.music-favorites'),
                loadComponent: async () => {
                  const { MusicFavoritesPage } =
                    await import('../feature/favorites-page/favorites.page');
                  return MusicFavoritesPage;
                },
              },
              ...detailRoutes,
            ],
          },
          {
            path: 'library',
            data: { musicTab: '/music/library' },
            children: [
              {
                path: '',
                title: marker('page-title.music'),
                loadComponent: async () => {
                  const { MusicLibraryPage } =
                    await import('../feature/library-page/library.page');
                  return MusicLibraryPage;
                },
              },
              ...detailRoutes,
            ],
          },
          {
            path: 'search',
            data: { musicTab: '/music/search' },
            children: [
              {
                path: '',
                title: marker('page-title.music-search'),
                loadComponent: async () => {
                  const { MusicSearchPage } =
                    await import('../feature/search-page/search.page');
                  return MusicSearchPage;
                },
              },
              ...detailRoutes,
            ],
          },
          {
            path: 'queue',
            title: marker('page-title.music-queue'),
            loadComponent: async () => {
              const { MusicQueuePage } =
                await import('../feature/queue-page/queue.page');
              return MusicQueuePage;
            },
          },
          {
            path: 'sources',
            title: marker('page-title.music-sources'),
            loadComponent: async () => {
              const { MusicSourcesPage } =
                await import('../feature/sources-page/sources.page');
              return MusicSourcesPage;
            },
          },
        ],
      },
    ],
  },
];
