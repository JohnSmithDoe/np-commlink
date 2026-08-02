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
import { Game, TrackplayId } from '../../model/trackplay.types';
import { gameTypeName } from '../../util/game-type.utils';
import { PageHeaderComponent } from '../../../@shared/ui/page-header/page-header.component';
import { TrackplayFacade } from '../../data';
import { TrackplayGameListItemComponent } from '../../ui/game-list-item/game-list-item.component';
import { presentGameDialog } from '../present-game-dialog';
import { presentListSettings } from '../present-list-settings';

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

  readonly runningGames = computed(() =>
    this.rxGames().filter((game) => !game.ended)
  );
  readonly endedGames = computed(() =>
    this.rxGames().filter((game) => game.ended)
  );

  readonly shownCount = computed(() => this.rxGames().length);
  readonly totalCount = computed(() => Object.keys(this.#gamesMap()).length);

  readonly settingsActive = computed(() => {
    const games = this.#config().games;
    return games.filter !== '' || games.typeId !== '' || !games.showEndedGames;
  });

  constructor() {
    addIcons({ optionsOutline, peopleOutline, diceOutline });
  }

  typeName(game: Game): string {
    return gameTypeName(game, this.rxGameTypes(), this.#unknownTypeLabel);
  }

  goToGame(id: TrackplayId): void {
    void this.#router.navigate(['/trackplay/game', id]);
  }

  deleteGame(game: Game): void {
    this.#facade.deleteGame(game);
  }

  async createGame(): Promise<void> {
    await presentGameDialog(this.#modalCtrl, this.#translate, {});
  }

  async openGameEdit(game: Game): Promise<void> {
    await presentGameDialog(this.#modalCtrl, this.#translate, {
      gameId: game.id,
    });
  }

  openSettings(event: Event): Promise<void> {
    return presentListSettings(this.#popoverCtrl, 'games', event);
  }
}
