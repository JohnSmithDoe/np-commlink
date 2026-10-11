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
    loadComponent: () =>
      import('../feature/artist-page/artist.page').then(
        (m) => m.MusicArtistPage
      ),
  },
  {
    path: 'album/:key',
    title: marker('page-title.music-album'),
    loadComponent: () =>
      import('../feature/album-page/album.page').then((m) => m.MusicAlbumPage),
  },
  {
    path: 'folder/:id',
    title: marker('page-title.music-folder'),
    loadComponent: () =>
      import('../feature/folder-page/folder.page').then(
        (m) => m.MusicFolderPage
      ),
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
        loadComponent: () =>
          import('../../@shared/feature/module-tabs-page/module-tabs.page').then(
            (m) => m.ModuleTabsPage
          ),
        children: [
          {
            path: 'home',
            data: { musicTab: '/music/home' },
            children: [
              {
                path: '',
                title: marker('page-title.music-home'),
                loadComponent: () =>
                  import('../feature/home-page/home.page').then(
                    (m) => m.MusicHomePage
                  ),
              },
              {
                path: 'playlist/:id',
                title: marker('page-title.music-playlist'),
                loadComponent: () =>
                  import('../feature/playlist-page/playlist.page').then(
                    (m) => m.MusicPlaylistPage
                  ),
              },
              {
                path: 'favorites',
                title: marker('page-title.music-favorites'),
                loadComponent: () =>
                  import('../feature/favorites-page/favorites.page').then(
                    (m) => m.MusicFavoritesPage
                  ),
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
                loadComponent: () =>
                  import('../feature/library-page/library.page').then(
                    (m) => m.MusicLibraryPage
                  ),
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
                loadComponent: () =>
                  import('../feature/search-page/search.page').then(
                    (m) => m.MusicSearchPage
                  ),
              },
              ...detailRoutes,
            ],
          },
          {
            path: 'queue',
            title: marker('page-title.music-queue'),
            loadComponent: () =>
              import('../feature/queue-page/queue.page').then(
                (m) => m.MusicQueuePage
              ),
          },
          {
            path: 'sources',
            title: marker('page-title.music-sources'),
            loadComponent: () =>
              import('../feature/sources-page/sources.page').then(
                (m) => m.MusicSourcesPage
              ),
          },
        ],
      },
    ],
  },
];
