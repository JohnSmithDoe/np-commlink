import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonFooter,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonSegment,
  IonSegmentButton,
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { serverOutline } from 'ionicons/icons';
import { EmptyStateComponent } from '../../../@shared/ui/empty-state/empty-state.component';
import { PageHeaderComponent } from '../../../@shared/ui/page-header/page-header.component';
import { CoverStore, LibraryFacade } from '../../data';
import { AlbumEntry, CoverRef } from '../../model/music.types';
import { PlayerBarComponent } from '../../smart-ui/player-bar/player-bar.component';
import { AlbumGridComponent } from '../../ui/album-grid/album-grid.component';

const LIBRARY_VIEWS = ['artists', 'albums', 'folders'] as const;

type LibraryView = (typeof LIBRARY_VIEWS)[number];

const isLibraryView = (view: unknown): view is LibraryView =>
  LIBRARY_VIEWS.includes(view as LibraryView);

@Component({
  selector: 'app-page-music-library',
  templateUrl: './library.page.html',
  styleUrls: ['./library.page.scss'],
  imports: [
    RouterLink,
    IonButton,
    IonContent,
    IonFooter,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonNote,
    IonSegment,
    IonSegmentButton,
    TranslatePipe,
    EmptyStateComponent,
    PageHeaderComponent,
    PlayerBarComponent,
    AlbumGridComponent,
  ],
})
export class MusicLibraryPage {
  readonly #library = inject(LibraryFacade);
  readonly #covers = inject(CoverStore);
  readonly #router = inject(Router);

  readonly view = signal<LibraryView>('artists');
  readonly hasSources = this.#library.hasSources;
  readonly loading = this.#library.loading;
  readonly serverFailed = this.#library.serverFailed;
  readonly artists = this.#library.artists;
  readonly albums = this.#library.albums;
  readonly folders = this.#library.folders;
  readonly loadCover = (cover: CoverRef) => this.#covers.load(cover);

  constructor() {
    addIcons({ serverOutline });
  }

  show(view: unknown): void {
    if (isLibraryView(view)) this.view.set(view);
  }

  openAlbum(album: AlbumEntry): void {
    void this.#router.navigate(['/music/library/album', album.key]);
  }
}
