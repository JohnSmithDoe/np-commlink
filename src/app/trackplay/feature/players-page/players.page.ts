import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { Router } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonIcon,
  IonList,
  ModalController,
  PopoverController,
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { optionsOutline, peopleOutline } from 'ionicons/icons';
import { IPlayer, IPlayerStats, TID } from '../../model/trackplay.types';
import { PageHeaderComponent } from '../../../@shared/ui/page-header/page-header.component';
import { TrackplayFacade } from '../../data';
import { TrackplayPlayerListItemComponent } from '../../ui/player-list-item/player-list-item.component';
import { TrackplayPlayerEditModalComponent } from '../player-edit-modal/player-edit-modal.component';
import { TrackplayListSettingsPopoverComponent } from '../../smart-ui/list-settings-popover/list-settings-popover.component';
import { presentModal } from '../../../@shared/util/present-modal';

const EMPTY_STATS: IPlayerStats = { play: 0, win: 0, loss: 0, open: 0 };

/**
 * Players list. New-player (+) and the sort/filter settings popover in the
 * header; tap a player for their detail page, swipe to rename (player-edit
 * dialog) or delete (undo toast raised automatically). Win/loss/open + total
 * stats are derived per player and passed down to the dumb row.
 */
@Component({
  selector: 'app-page-trackplay-players',
  templateUrl: './players.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonContent,
    IonList,
    IonButton,
    IonIcon,
    TranslateModule,
    PageHeaderComponent,
    TrackplayPlayerListItemComponent,
  ],
})
export class TrackplayPlayersPage {
  readonly #facade = inject(TrackplayFacade);
  readonly #router = inject(Router);
  readonly #modalCtrl = inject(ModalController);
  readonly #popoverCtrl = inject(PopoverController);

  readonly rxPlayers = this.#facade.playerList;
  readonly rxStats = this.#facade.playerStats;
  readonly #allPlayers = this.#facade.players;

  // Header counter: how many rows survive the players filter vs. the total.
  readonly shown = computed(() => this.rxPlayers().length);
  readonly total = computed(() => Object.keys(this.#allPlayers()).length);

  constructor() {
    addIcons({ optionsOutline, peopleOutline });
  }

  statsFor(player: IPlayer): IPlayerStats {
    return this.rxStats()[player.id] ?? EMPTY_STATS;
  }

  goToPlayer(id: TID): void {
    void this.#router.navigate(['/trackplay/player', id]);
  }

  deletePlayer(player: IPlayer): void {
    this.#facade.deletePlayer(player);
  }

  async newPlayer(): Promise<void> {
    await presentModal(this.#modalCtrl, TrackplayPlayerEditModalComponent);
  }

  async openPlayerEdit(player: IPlayer): Promise<void> {
    await presentModal(this.#modalCtrl, TrackplayPlayerEditModalComponent, {
      playerId: player.id,
    });
  }

  async openSettings(event: Event): Promise<void> {
    const popover = await this.#popoverCtrl.create({
      component: TrackplayListSettingsPopoverComponent,
      componentProps: { mode: 'players' },
      event: event,
    });
    await popover.present();
  }
}
