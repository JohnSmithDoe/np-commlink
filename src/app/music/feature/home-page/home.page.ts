import { Component, inject, resource } from '@angular/core';
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
} from '@ionic/angular/standalone';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { serverOutline, starOutline } from 'ionicons/icons';
import { EmptyStateComponent } from '../../../@shared/ui/empty-state/empty-state.component';
import { PageHeaderComponent } from '../../../@shared/ui/page-header/page-header.component';
import { Marker } from '../../../@shared/model/app.types';
import { CoverStore, JamGateway, LibraryFacade } from '../../data';
import { HOME_LISTS } from '../../model/music.consts';
import { AlbumEntry, CoverRef, HomeList } from '../../model/music.types';
import { PlayerBarComponent } from '../../smart-ui/player-bar/player-bar.component';
import { AlbumGridComponent } from '../../ui/album-grid/album-grid.component';
import { TrackTimePipe } from '../../util/track-time.pipe';

const LIST_LABELS: Record<HomeList, Marker> = {
  recent: marker('music.home.recent'),
  frequent: marker('music.home.frequent'),
  faved: marker('music.home.faved'),
  random: marker('music.home.random'),
};

@Component({
  selector: 'app-page-music-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
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
    TranslatePipe,
    EmptyStateComponent,
    PageHeaderComponent,
    PlayerBarComponent,
    AlbumGridComponent,
    TrackTimePipe,
  ],
})
export class MusicHomePage {
  readonly #library = inject(LibraryFacade);
  readonly #covers = inject(CoverStore);
  readonly #router = inject(Router);

  readonly hasSources = this.#library.hasSources;
  readonly connected = inject(JamGateway).connected;
  readonly loadCover = (cover: CoverRef) => this.#covers.load(cover);
  readonly sections = HOME_LISTS.map((list) => ({
    list,
    label: LIST_LABELS[list],
    albums: resource({
      params: () => this.#library.albums(),
      loader: () => this.#library.homeList(list),
    }),
  }));
  readonly playlists = resource({
    params: () => this.connected(),
    loader: () => this.#library.playlists(),
  });

  constructor() {
    addIcons({ serverOutline, starOutline });
  }

  openAlbum(album: AlbumEntry): void {
    void this.#router.navigate(['/music/home/album', album.key]);
  }
}
