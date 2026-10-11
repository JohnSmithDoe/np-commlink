import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import {
  folderOpenOutline,
  pauseOutline,
  playOutline,
  playSkipBackOutline,
  playSkipForwardOutline,
} from 'ionicons/icons';
import { EmptyStateComponent } from '../../../@shared/ui/empty-state/empty-state.component';
import { PageHeaderComponent } from '../../../@shared/ui/page-header/page-header.component';
import { MusicFacade } from '../../data';
import { Track } from '../../model/music.types';

@Component({
  selector: 'app-page-music',
  templateUrl: './music.page.html',
  styleUrls: ['./music.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonButton,
    IonButtons,
    IonContent,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    TranslatePipe,
    EmptyStateComponent,
    PageHeaderComponent,
  ],
})
export class MusicPage {
  readonly #music = inject(MusicFacade);

  readonly supported = this.#music.supported;
  readonly folder = this.#music.folder;
  readonly tracks = this.#music.tracks;
  readonly current = this.#music.current;
  readonly playing = this.#music.playing;

  constructor() {
    addIcons({
      folderOpenOutline,
      pauseOutline,
      playOutline,
      playSkipBackOutline,
      playSkipForwardOutline,
    });
  }

  pickFolder(): void {
    void this.#music.pickFolder();
  }

  play(track: Track): void {
    void this.#music.playAt(track);
  }

  togglePlay(): void {
    void this.#music.togglePlay();
  }

  next(): void {
    void this.#music.next();
  }

  previous(): void {
    void this.#music.previous();
  }
}
