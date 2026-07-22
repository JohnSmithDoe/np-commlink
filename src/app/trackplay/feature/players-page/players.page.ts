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
  ViewWillEnter,
} from '@ionic/angular/standalone';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { optionsOutline } from 'ionicons/icons';
import { IPlayer, IPlayerStats, TID } from '../../model';
import { PageHeaderComponent } from '../../../@shared/ui/page-header/page-header.component';
import {
  TrackplayActions,
  selectPlayerList,
  selectPlayers,
  selectPlayerStats,
} from '../../data';
import { TrackplayPlayerListItemComponent } from '../../ui/player-list-item/player-list-item.component';
import { TrackplayPlayerEditDialogComponent } from '../../smart-ui/player-edit-dialog/player-edit-dialog.component';
import { TrackplayGameSettingsPopoverComponent } from '../../smart-ui/game-settings-popover/game-settings-popover.component';

const EMPTY_STATS: IPlayerStats = { play: 0, win: 0, loss: 0, open: 0 };

/**
 * Players list. New-player (+) and the sort/filter settings popover in the
 * header; tap a player for their detail page, swipe to rename (player-edit
 * dialog) or delete (undo toast raised automatically). Win/loss/open + total
 * stats are derived per player and passed down to the dumb row.
 */
@Component({
  selector: 'app-trackplay-players-page',
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
export class TrackplayPlayersPage implements ViewWillEnter {
  readonly #store = inject(Store);
  readonly #router = inject(Router);
  readonly #modalCtrl = inject(ModalController);
  readonly #popoverCtrl = inject(PopoverController);

  readonly rxPlayers = this.#store.selectSignal(selectPlayerList);
  readonly rxStats = this.#store.selectSignal(selectPlayerStats);
  readonly #allPlayers = this.#store.selectSignal(selectPlayers);

  // Header counter: how many rows survive the players filter vs. the total.
  readonly shown = computed(() => this.rxPlayers().length);
  readonly total = computed(() => Object.keys(this.#allPlayers()).length);

  constructor() {
    addIcons({ optionsOutline });
  }

  ionViewWillEnter(): void {
    this.#store.dispatch(TrackplayActions.enterPlayersPage());
  }

  statsFor(player: IPlayer): IPlayerStats {
    return this.rxStats()[player.id] ?? EMPTY_STATS;
  }

  goToPlayer(id: TID): void {
    void this.#router.navigate(['/trackplay/player', id]);
  }

  deletePlayer(player: IPlayer): void {
    this.#store.dispatch(TrackplayActions.deletePlayer(player));
  }

  async newPlayer(): Promise<void> {
    const modal = await this.#modalCtrl.create({
      component: TrackplayPlayerEditDialogComponent,
    });
    await modal.present();
  }

  async openPlayerEdit(player: IPlayer): Promise<void> {
    const modal = await this.#modalCtrl.create({
      component: TrackplayPlayerEditDialogComponent,
      componentProps: { playerId: player.id },
    });
    await modal.present();
  }

  async openSettings(event: Event): Promise<void> {
    const popover = await this.#popoverCtrl.create({
      component: TrackplayGameSettingsPopoverComponent,
      componentProps: { mode: 'players' },
      event: event,
    });
    await popover.present();
  }
}
