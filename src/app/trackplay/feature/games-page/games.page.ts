import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonIcon,
  IonItemDivider,
  IonLabel,
  IonList,
  IonRouterLink,
  ModalController,
  PopoverController,
} from '@ionic/angular/standalone';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { optionsOutline, peopleOutline, diceOutline } from 'ionicons/icons';
import { IGame, TID } from '../../model/trackplay.types';
import { gameTypeName } from '../../util/game-type.utils';
import { PageHeaderComponent } from '../../../@shared/ui/page-header/page-header.component';
import { TrackplayFacade } from '../../data';
import { TrackplayGameListItemComponent } from '../../ui/game-list-item/game-list-item.component';
import { TrackplayGameEditModalComponent } from '../game-edit-modal/game-edit-modal.component';
import { TrackplayListSettingsPopoverComponent } from '../../smart-ui/list-settings-popover/list-settings-popover.component';
import { presentModal } from '../../../@shared/util/present-modal';

/**
 * TRACKPLAY program home — the games list. Header: new-game (+), a jump to the
 * players / game-types sub-pages, and the sort/filter settings popover (which
 * lights up while the list is filtered). The list is split into "running" and
 * "ended" sections (ended games already sink to the bottom). Tapping a game
 * opens its scoring grid; swipe to edit (game-edit dialog) or delete (the undo
 * toast is raised automatically by the effect).
 */
@Component({
  selector: 'app-page-trackplay-games',
  templateUrl: './games.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonContent,
    IonList,
    IonButton,
    IonIcon,
    IonItemDivider,
    IonLabel,
    IonRouterLink,
    RouterLink,
    TranslatePipe,
    PageHeaderComponent,
    TrackplayGameListItemComponent,
  ],
})
export class TrackplayGamesPage {
  readonly #facade = inject(TrackplayFacade);
  readonly #router = inject(Router);
  readonly #modalCtrl = inject(ModalController);
  readonly #popoverCtrl = inject(PopoverController);
  readonly #translate = inject(TranslateService);
  readonly #unknownTypeLabel = this.#translate.instant(
    marker('trackplay.label.unknown-type')
  );

  readonly rxGames = this.#facade.gameList;
  readonly rxGameTypes = this.#facade.gameTypes;
  readonly #gamesMap = this.#facade.games;
  readonly #config = this.#facade.config;

  // The (already ended-sunk) list, split for the two section dividers.
  readonly runningGames = computed(() =>
    this.rxGames().filter((game) => !game.ended)
  );
  readonly endedGames = computed(() =>
    this.rxGames().filter((game) => game.ended)
  );

  readonly shownCount = computed(() => this.rxGames().length);
  readonly totalCount = computed(() => Object.keys(this.#gamesMap()).length);

  // Filter/sort button lights up whenever the list is not showing everything —
  // a port of the legacy `all.length === games.length` warning state.
  readonly settingsActive = computed(() => {
    const games = this.#config().games;
    return games.filter !== '' || games.typeId !== '' || !games.showEndedGames;
  });

  constructor() {
    addIcons({ optionsOutline, peopleOutline, diceOutline });
  }

  typeName(game: IGame): string {
    return gameTypeName(game, this.rxGameTypes(), this.#unknownTypeLabel);
  }

  goToGame(id: TID): void {
    void this.#router.navigate(['/trackplay/game', id]);
  }

  deleteGame(game: IGame): void {
    this.#facade.deleteGame(game);
  }

  async newGame(): Promise<void> {
    await this.#presentGameDialog({});
  }

  async openGameEdit(game: IGame): Promise<void> {
    await this.#presentGameDialog({ gameId: game.id });
  }

  async openSettings(event: Event): Promise<void> {
    const popover = await this.#popoverCtrl.create({
      component: TrackplayListSettingsPopoverComponent,
      componentProps: { mode: 'games' },
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
