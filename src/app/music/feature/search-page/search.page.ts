import { Component, computed, inject, resource, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  IonContent,
  IonFooter,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonSearchbar,
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { PageHeaderComponent } from '../../../@shared/ui/page-header/page-header.component';
import { CoverStore, LibraryFacade, PlayerFacade } from '../../data';
import { AlbumEntry, CoverRef, Track } from '../../model/music.types';
import { PlayerBarComponent } from '../../smart-ui/player-bar/player-bar.component';
import { AlbumGridComponent } from '../../ui/album-grid/album-grid.component';
import { TrackListComponent } from '../../ui/track-list/track-list.component';

const SEARCH_TAB = '/music/search';

@Component({
  selector: 'app-page-music-search',
  templateUrl: './search.page.html',
  styleUrls: ['./search.page.scss'],
  imports: [
    RouterLink,
    IonContent,
    IonFooter,
    IonItem,
    IonLabel,
    IonList,
    IonNote,
    IonSearchbar,
    TranslatePipe,
    PageHeaderComponent,
    PlayerBarComponent,
    AlbumGridComponent,
    TrackListComponent,
  ],
})
export class MusicSearchPage {
  readonly #library = inject(LibraryFacade);
  readonly #player = inject(PlayerFacade);
  readonly #covers = inject(CoverStore);
  readonly #router = inject(Router);

  readonly tab = SEARCH_TAB;
  readonly query = signal('');
  readonly results = resource({
    params: () => this.query().trim() || undefined,
    loader: ({ params }) => this.#library.search(params),
  });
  readonly currentId = computed(() => this.#player.current()?.track.id);
  readonly loadCover = (cover: CoverRef) => this.#covers.load(cover);

  search(event: CustomEvent<{ value?: string | null }>): void {
    this.query.set(event.detail.value ?? '');
  }

  openAlbum(album: AlbumEntry): void {
    void this.#router.navigate([SEARCH_TAB, 'album', album.key]);
  }

  play(track: Track): void {
    if (this.results.hasValue())
      void this.#player.play(this.results.value().tracks, track);
  }

  enqueue(track: Track): void {
    void this.#player.enqueue([track]);
  }

  async favorite(track: Track): Promise<void> {
    const updated = await this.#library.toggleFavorite(track);
    this.results.update(
      (results) =>
        results && {
          ...results,
          tracks: results.tracks.map((known) =>
            known.id === updated.id ? updated : known
          ),
        }
    );
  }
}
