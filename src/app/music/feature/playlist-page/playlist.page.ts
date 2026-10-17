import { Component, computed, inject, resource } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonFooter,
  IonIcon,
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { playOutline } from 'ionicons/icons';
import { PageHeaderComponent } from '../../../@shared/ui/page-header/page-header.component';
import { PageReturnComponent } from '../../../@shared/ui/page-return/page-return.component';
import { LibraryFacade, PlayerFacade } from '../../data';
import { Track } from '../../model/music.types';
import { PlayerBarComponent } from '../../smart-ui/player-bar/player-bar.component';
import { TrackListComponent } from '../../ui/track-list/track-list.component';

@Component({
  selector: 'app-page-music-playlist',
  templateUrl: './playlist.page.html',
  styleUrls: ['./playlist.page.scss'],
  imports: [
    IonButton,
    IonContent,
    IonFooter,
    IonIcon,
    TranslatePipe,
    PageHeaderComponent,
    PageReturnComponent,
    PlayerBarComponent,
    TrackListComponent,
  ],
})
export class MusicPlaylistPage {
  readonly #library = inject(LibraryFacade);
  readonly #player = inject(PlayerFacade);
  readonly #id = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';

  readonly playlist = resource({
    loader: () => this.#library.playlist(this.#id),
  });
  readonly tracks = resource({
    loader: () => this.#library.playlistTracks(this.#id),
  });
  readonly currentId = computed(() => this.#player.current()?.track.id);

  constructor() {
    addIcons({ playOutline });
  }

  playAll(): void {
    if (this.tracks.hasValue()) void this.#player.play(this.tracks.value());
  }

  play(track: Track): void {
    if (this.tracks.hasValue())
      void this.#player.play(this.tracks.value(), track);
  }

  enqueue(track: Track): void {
    void this.#player.enqueue([track]);
  }

  async favorite(track: Track): Promise<void> {
    const updated = await this.#library.toggleFavorite(track);
    this.tracks.update((tracks) =>
      tracks?.map((known) => (known.id === updated.id ? updated : known))
    );
  }
}
