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
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import {
  addOutline,
  arrowBackOutline,
  createOutline,
  optionsOutline,
} from 'ionicons/icons';
import { IGame, TID } from '../../model/trackplay.types';
import { gameTypeName } from '../../util/game-type.utils';
import { TrackplayFacade } from '../../data';
import { TrackplayGameListItemComponent } from '../../ui/game-list-item/game-list-item.component';
import { TrackplayGameEditModalComponent } from '../game-edit-modal/game-edit-modal.component';
import { TrackplayPlayerEditModalComponent } from '../player-edit-modal/player-edit-modal.component';
import { TrackplayListSettingsPopoverComponent } from '../../smart-ui/list-settings-popover/list-settings-popover.component';
import { presentModal } from '../../../@shared/util/present-modal';

/**
 * Single-player detail: derived win/loss/open + total-play stats, a rename
 * shortcut, "new game for this player" (opens the game dialog pre-selecting
 * them), and this player's games list (its own `gamesForPlayer` sort/filter
 * config). Back button returns to the players list.
 */
@Component({
  selector: 'app-page-trackplay-player',
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
    TranslatePipe,
    TrackplayGameListItemComponent,
  ],
})
export class TrackplayPlayerPage {
  readonly #facade = inject(TrackplayFacade);
  readonly #router = inject(Router);
  readonly #route = inject(ActivatedRoute);
  readonly #modalCtrl = inject(ModalController);
  readonly #popoverCtrl = inject(PopoverController);
  readonly #translate = inject(TranslateService);
  readonly #unknownTypeLabel = this.#translate.instant(
    marker('trackplay.label.unknown-type')
  );

  // The route id is fixed for the lifetime of this page instance.
  readonly id: TID = this.#route.snapshot.paramMap.get('id') ?? '';

  readonly rxPlayer = this.#facade.playerById(this.id);
  readonly rxGames = this.#facade.gamesForPlayer(this.id);
  readonly rxStats = this.#facade.statsForPlayer(this.id);
  readonly rxGameTypes = this.#facade.gameTypes;

  constructor() {
    addIcons({ addOutline, arrowBackOutline, createOutline, optionsOutline });
  }

  typeName(game: IGame): string {
    return gameTypeName(game, this.rxGameTypes(), this.#unknownTypeLabel);
  }

  goBack(): void {
    void this.#router.navigate(['/trackplay/players']);
  }

  goToGame(gameId: TID): void {
    void this.#router.navigate(['/trackplay/game', gameId]);
  }

  deleteGame(game: IGame): void {
    this.#facade.deleteGame(game);
  }

  async openPlayerEdit(): Promise<void> {
    await presentModal(
      this.#modalCtrl,
      TrackplayPlayerEditModalComponent,
      this.#translate.instant(marker('page-title.trackplay-player')),
      { playerId: this.id }
    );
  }

  async newGame(): Promise<void> {
    await this.#presentGameDialog({ presetPlayerIds: [this.id] });
  }

  async openGameEdit(game: IGame): Promise<void> {
    await this.#presentGameDialog({ gameId: game.id });
  }

  async openSettings(event: Event): Promise<void> {
    const popover = await this.#popoverCtrl.create({
      component: TrackplayListSettingsPopoverComponent,
      componentProps: { mode: 'gamesForPlayer' },
      event: event,
    });
    await popover.present();
  }

  async #presentGameDialog(properties: {
    gameId?: TID;
    presetPlayerIds?: TID[];
  }): Promise<void> {
    await presentModal(
      this.#modalCtrl,
      TrackplayGameEditModalComponent,
      this.#translate.instant(marker('page-title.trackplay-game')),
      properties
    );
  }
}
