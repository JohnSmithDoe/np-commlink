import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  resource,
} from '@angular/core';
import {
  IonButton,
  IonContent,
  IonFooter,
  IonIcon,
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { playOutline } from 'ionicons/icons';
import { EmptyStateComponent } from '../../../@shared/ui/empty-state/empty-state.component';
import { PageHeaderComponent } from '../../../@shared/ui/page-header/page-header.component';
import { PageReturnComponent } from '../../../@shared/ui/page-return/page-return.component';
import { LibraryFacade, PlayerFacade } from '../../data';
import { Track } from '../../model/music.types';
import { PlayerBarComponent } from '../../smart-ui/player-bar/player-bar.component';
import { TrackListComponent } from '../../ui/track-list/track-list.component';

@Component({
  selector: 'app-page-music-favorites',
  templateUrl: './favorites.page.html',
  styleUrls: ['./favorites.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonButton,
    IonContent,
    IonFooter,
    IonIcon,
    TranslatePipe,
    EmptyStateComponent,
    PageHeaderComponent,
    PageReturnComponent,
    PlayerBarComponent,
    TrackListComponent,
  ],
})
export class MusicFavoritesPage {
  readonly #library = inject(LibraryFacade);
  readonly #player = inject(PlayerFacade);
  readonly tracks = resource({
    loader: () => this.#library.favoriteTracks(),
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
