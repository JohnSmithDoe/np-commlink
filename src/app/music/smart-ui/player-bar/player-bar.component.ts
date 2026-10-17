import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonButton, IonIcon } from '@ionic/angular';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import {
  pauseOutline,
  playOutline,
  playSkipForwardOutline,
} from 'ionicons/icons';
import { CoverStore, PlayerFacade } from '../../data';
import { CoverRef } from '../../model/music.types';
import { MusicCoverComponent } from '../../ui/music-cover/music-cover.component';

@Component({
  selector: 'app-music-player-bar',
  templateUrl: './player-bar.component.html',
  styleUrls: ['./player-bar.component.scss'],
  imports: [RouterLink, IonButton, IonIcon, TranslatePipe, MusicCoverComponent],
})
export class PlayerBarComponent {
  readonly #player = inject(PlayerFacade);
  readonly #covers = inject(CoverStore);

  readonly current = this.#player.current;
  readonly playing = this.#player.playing;
  readonly loadCover = (cover: CoverRef) => this.#covers.load(cover);

  constructor() {
    addIcons({ pauseOutline, playOutline, playSkipForwardOutline });
  }

  togglePlay(): void {
    void this.#player.togglePlay();
  }

  next(): void {
    void this.#player.next();
  }
}
