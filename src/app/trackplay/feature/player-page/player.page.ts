import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonList,
  IonTitle,
  IonToolbar,
  ModalController,
  PopoverController,
} from '@ionic/angular/standalone';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import {
  addOutline,
  arrowBackOutline,
  createOutline,
  optionsOutline,
} from 'ionicons/icons';
import { IGame, IonViewWillEnter, TID } from '../../../@shared/types';
import { TrackplayActions } from '../../data/trackplay.actions';
import {
  selectGamesForPlayer,
  selectGameTypes,
  selectPlayerById,
  selectStatsForPlayer,
} from '../../data/trackplay.selector';
import { TrackplayGameListItemComponent } from '../../ui/game-list-item/game-list-item.component';
import { TrackplayGameEditDialogComponent } from '../../smart-ui/game-edit-dialog/game-edit-dialog.component';
import { TrackplayPlayerEditDialogComponent } from '../../smart-ui/player-edit-dialog/player-edit-dialog.component';
import { TrackplayGameSettingsPopoverComponent } from '../../smart-ui/game-settings-popover/game-settings-popover.component';

/**
 * Single-player detail: derived win/loss/open + total-play stats, a rename
 * shortcut, "new game for this player" (opens the game dialog pre-selecting
 * them), and this player's games list (its own `gamesForPlayer` sort/filter
 * config). Back button returns to the players list.
 */
@Component({
  selector: 'app-trackplay-player-page',
  templateUrl: './player.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonHeader,
    IonToolbar,
    IonButtons,
    IonButton,
    IonIcon,
    IonTitle,
    IonContent,
    IonList,
    TranslateModule,
    TrackplayGameListItemComponent,
  ],
})
export class TrackplayPlayerPage implements IonViewWillEnter {
  readonly #store = inject(Store);
  readonly #router = inject(Router);
  readonly #route = inject(ActivatedRoute);
  readonly #modalCtrl = inject(ModalController);
  readonly #popoverCtrl = inject(PopoverController);

  // The route id is fixed for the lifetime of this page instance.
  readonly id: TID = this.#route.snapshot.paramMap.get('id') ?? '';

  readonly rxPlayer = this.#store.selectSignal(selectPlayerById(this.id));
  readonly rxGames = this.#store.selectSignal(selectGamesForPlayer(this.id));
  readonly rxStats = this.#store.selectSignal(selectStatsForPlayer(this.id));
  readonly rxGameTypes = this.#store.selectSignal(selectGameTypes);

  constructor() {
    addIcons({ addOutline, arrowBackOutline, createOutline, optionsOutline });
  }

  ionViewWillEnter(): void {
    this.#store.dispatch(TrackplayActions.enterPlayerPage(this.id));
  }

  typeName(game: IGame): string {
    return this.rxGameTypes()[game.type]?.name ?? 'Unbekannt';
  }

  goBack(): void {
    void this.#router.navigate(['/trackplay/players']);
  }

  goToGame(gameId: TID): void {
    void this.#router.navigate(['/trackplay/game', gameId]);
  }

  deleteGame(game: IGame): void {
    this.#store.dispatch(TrackplayActions.deleteGame(game));
  }

  async openPlayerEdit(): Promise<void> {
    const modal = await this.#modalCtrl.create({
      component: TrackplayPlayerEditDialogComponent,
      componentProps: { playerId: this.id },
    });
    await modal.present();
  }

  async newGame(): Promise<void> {
    await this.#presentGameDialog({ presetPlayerIds: [this.id] });
  }

  async openGameEdit(game: IGame): Promise<void> {
    await this.#presentGameDialog({ gameId: game.id });
  }

  async openSettings(ev: Event): Promise<void> {
    const popover = await this.#popoverCtrl.create({
      component: TrackplayGameSettingsPopoverComponent,
      componentProps: { mode: 'gamesForPlayer' },
      event: ev,
    });
    await popover.present();
  }

  async #presentGameDialog(props: {
    gameId?: TID;
    presetPlayerIds?: TID[];
  }): Promise<void> {
    const modal = await this.#modalCtrl.create({
      component: TrackplayGameEditDialogComponent,
      componentProps: props,
    });
    await modal.present();
  }
}
