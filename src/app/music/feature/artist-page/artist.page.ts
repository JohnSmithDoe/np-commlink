import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonFooter,
  IonIcon,
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { addCircleOutline, playOutline } from 'ionicons/icons';
import { PageHeaderComponent } from '../../../@shared/ui/page-header/page-header.component';
import { PageReturnComponent } from '../../../@shared/ui/page-return/page-return.component';
import { CoverStore, LibraryFacade, PlayerFacade } from '../../data';
import { AlbumEntry, CoverRef } from '../../model/music.types';
import { PlayerBarComponent } from '../../smart-ui/player-bar/player-bar.component';
import { AlbumGridComponent } from '../../ui/album-grid/album-grid.component';
import { musicTabOf } from '../../util/music-tab';

@Component({
  selector: 'app-page-music-artist',
  templateUrl: './artist.page.html',
  styleUrls: ['./artist.page.scss'],
  imports: [
    IonButton,
    IonContent,
    IonFooter,
    IonIcon,
    TranslatePipe,
    PageHeaderComponent,
    PageReturnComponent,
    PlayerBarComponent,
    AlbumGridComponent,
  ],
})
export class MusicArtistPage {
  readonly #library = inject(LibraryFacade);
  readonly #player = inject(PlayerFacade);
  readonly #covers = inject(CoverStore);
  readonly #router = inject(Router);
  readonly #route = inject(ActivatedRoute);
  readonly #key = this.#route.snapshot.paramMap.get('key') ?? '';

  readonly artist = computed(() => this.#library.artist(this.#key));
  readonly albums = computed(() => this.#library.albumsOf(this.#key));
  readonly loadCover = (cover: CoverRef) => this.#covers.load(cover);

  constructor() {
    addIcons({ addCircleOutline, playOutline });
  }

  async playAll(): Promise<void> {
    await this.#player.play(await this.#library.artistTracks(this.#key));
  }

  async enqueueAll(): Promise<void> {
    await this.#player.enqueue(await this.#library.artistTracks(this.#key));
  }

  openAlbum(album: AlbumEntry): void {
    void this.#router.navigate([musicTabOf(this.#route), 'album', album.key]);
  }
}
