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
import { addCircleOutline, playOutline } from 'ionicons/icons';
import { EmptyStateComponent } from '../../../@shared/ui/empty-state/empty-state.component';
import { PageHeaderComponent } from '../../../@shared/ui/page-header/page-header.component';
import { PageReturnComponent } from '../../../@shared/ui/page-return/page-return.component';
import { CoverStore, LibraryFacade, PlayerFacade } from '../../data';
import { CoverRef, Track } from '../../model/music.types';
import { PlayerBarComponent } from '../../smart-ui/player-bar/player-bar.component';
import { MusicCoverComponent } from '../../ui/music-cover/music-cover.component';
import { TrackListComponent } from '../../ui/track-list/track-list.component';
import { firstCover } from '../../util/library.utils';
import { TrackTimePipe } from '../../util/track-time.pipe';

@Component({
  selector: 'app-page-music-album',
  templateUrl: './album.page.html',
  styleUrls: ['./album.page.scss'],
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
    MusicCoverComponent,
    TrackListComponent,
    TrackTimePipe,
  ],
})
export class MusicAlbumPage {
  readonly #library = inject(LibraryFacade);
  readonly #player = inject(PlayerFacade);
  readonly #covers = inject(CoverStore);
  readonly #key = inject(ActivatedRoute).snapshot.paramMap.get('key') ?? '';

  readonly album = computed(() => this.#library.album(this.#key));
  readonly tracks = resource({
    params: () => this.album(),
    loader: () => this.#library.albumTracks(this.#key),
  });
  readonly cover = computed(() => {
    return (
      this.album()?.cover ??
      (this.tracks.hasValue() ? firstCover(this.tracks.value()) : undefined)
    );
  });
  readonly totalMs = computed(() => {
    return this.tracks.hasValue()
      ? this.tracks
          .value()
          .reduce((sum, track) => sum + (track.durationMs ?? 0), 0)
      : 0;
  });
  readonly currentId = computed(() => this.#player.current()?.track.id);
  readonly loadCover = (cover: CoverRef) => this.#covers.load(cover);

  constructor() {
    addIcons({ addCircleOutline, playOutline });
  }

  playAll(): void {
    if (this.tracks.hasValue()) void this.#player.play(this.tracks.value());
  }

  enqueueAll(): void {
    if (this.tracks.hasValue()) void this.#player.enqueue(this.tracks.value());
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
