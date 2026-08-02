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
import { Game, TrackplayId } from '../../model/trackplay.types';
import { gameTypeName } from '../../util/game-type.utils';
import { TrackplayFacade } from '../../data';
import { TrackplayGameListItemComponent } from '../../ui/game-list-item/game-list-item.component';
import { TrackplayPlayerEditModalComponent } from '../player-edit-modal/player-edit-modal.component';
import { presentModal } from '../../../@shared/util/app.modal.utils';
import { presentListSettings } from '../present-list-settings';
import { presentGameDialog } from '../present-game-dialog';

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

  readonly id: TrackplayId = this.#route.snapshot.paramMap.get('id') ?? '';

  readonly rxPlayer = this.#facade.playerById(this.id);
  readonly rxGames = this.#facade.gamesForPlayer(this.id);
  readonly rxStats = this.#facade.statsForPlayer(this.id);
  readonly rxGameTypes = this.#facade.gameTypes;

  constructor() {
    addIcons({ addOutline, arrowBackOutline, createOutline, optionsOutline });
  }

  typeName(game: Game): string {
    return gameTypeName(game, this.rxGameTypes(), this.#unknownTypeLabel);
  }

  goBack(): void {
    void this.#router.navigate(['/trackplay/players']);
  }

  goToGame(gameId: TrackplayId): void {
    void this.#router.navigate(['/trackplay/game', gameId]);
  }

  deleteGame(game: Game): void {
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

  async createGame(): Promise<void> {
    await presentGameDialog(this.#modalCtrl, this.#translate, {
      presetPlayerIds: [this.id],
    });
  }

  async openGameEdit(game: Game): Promise<void> {
    await presentGameDialog(this.#modalCtrl, this.#translate, {
      gameId: game.id,
    });
  }

  openSettings(event: Event): Promise<void> {
    return presentListSettings(this.#popoverCtrl, 'gamesForPlayer', event);
  }
}
