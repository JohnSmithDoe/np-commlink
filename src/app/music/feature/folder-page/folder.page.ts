import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  resource,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
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
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { playOutline } from 'ionicons/icons';
import { PageHeaderComponent } from '../../../@shared/ui/page-header/page-header.component';
import { PageReturnComponent } from '../../../@shared/ui/page-return/page-return.component';
import { LibraryFacade, PlayerFacade } from '../../data';
import { Track } from '../../model/music.types';
import { PlayerBarComponent } from '../../smart-ui/player-bar/player-bar.component';
import { TrackListComponent } from '../../ui/track-list/track-list.component';
import { musicTabOf } from '../../util/music-tab';

@Component({
  selector: 'app-page-music-folder',
  templateUrl: './folder.page.html',
  styleUrls: ['./folder.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
    PageHeaderComponent,
    PageReturnComponent,
    PlayerBarComponent,
    TrackListComponent,
  ],
})
export class MusicFolderPage {
  readonly #library = inject(LibraryFacade);
  readonly #player = inject(PlayerFacade);
  readonly #route = inject(ActivatedRoute);
  readonly #id = this.#route.snapshot.paramMap.get('id') ?? '';

  readonly tab = musicTabOf(this.#route);
  readonly folder = computed(() =>
    this.#library.folders().find((folder) => folder.id === this.#id)
  );
  readonly contents = resource({
    params: () => this.#library.folders(),
    loader: () => this.#library.folderContents(this.#id),
  });
  readonly currentId = computed(() => this.#player.current()?.track.id);

  constructor() {
    addIcons({ playOutline });
  }

  playAll(): void {
    if (this.contents.hasValue())
      void this.#player.play(this.contents.value().tracks);
  }

  play(track: Track): void {
    if (this.contents.hasValue())
      void this.#player.play(this.contents.value().tracks, track);
  }

  enqueue(track: Track): void {
    void this.#player.enqueue([track]);
  }
}
