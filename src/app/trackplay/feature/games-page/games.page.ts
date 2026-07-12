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
  ModalController,
  PopoverController,
} from '@ionic/angular/standalone';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { optionsOutline, peopleOutline, diceOutline } from 'ionicons/icons';
import { IGame, IonViewWillEnter, TID } from '../../../@shared/types';
import { PageHeaderComponent } from '../../../@shared/ui/page-header/page-header.component';
import { TrackplayActions } from '../../data/trackplay.actions';
import {
  selectGameList,
  selectGames,
  selectGameTypes,
  selectTrackplayConfig,
} from '../../data/trackplay.selector';
import { TrackplayGameListItemComponent } from '../../ui/game-list-item/game-list-item.component';
import { TrackplayGameEditDialogComponent } from '../../smart-ui/game-edit-dialog/game-edit-dialog.component';
import { TrackplayGameSettingsPopoverComponent } from '../../smart-ui/game-settings-popover/game-settings-popover.component';

/**
 * TRACKPLAY program home — the games list. Header: new-game (+), a jump to the
 * players / game-types sub-pages, and the sort/filter settings popover (which
 * lights up while the list is filtered). The list is split into "running" and
 * "ended" sections (ended games already sink to the bottom). Tapping a game
 * opens its scoring grid; swipe to edit (game-edit dialog) or delete (the undo
 * toast is raised automatically by the effect).
 */
@Component({
  selector: 'app-trackplay-games-page',
  templateUrl: './games.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonContent,
    IonList,
    IonButton,
    IonIcon,
    IonItemDivider,
    IonLabel,
    RouterLink,
    TranslateModule,
    PageHeaderComponent,
    TrackplayGameListItemComponent,
  ],
})
export class TrackplayGamesPage implements IonViewWillEnter {
  readonly #store = inject(Store);
  readonly #router = inject(Router);
  readonly #modalCtrl = inject(ModalController);
  readonly #popoverCtrl = inject(PopoverController);

  readonly rxGames = this.#store.selectSignal(selectGameList);
  readonly rxGameTypes = this.#store.selectSignal(selectGameTypes);
  readonly #gamesMap = this.#store.selectSignal(selectGames);
  readonly #config = this.#store.selectSignal(selectTrackplayConfig);

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

  ionViewWillEnter(): void {
    this.#store.dispatch(TrackplayActions.enterGamesPage());
  }

  typeName(game: IGame): string {
    return this.rxGameTypes()[game.type]?.name ?? 'Unbekannt';
  }

  goToGame(id: TID): void {
    void this.#router.navigate(['/trackplay/game', id]);
  }

  deleteGame(game: IGame): void {
    this.#store.dispatch(TrackplayActions.deleteGame(game));
  }

  async newGame(): Promise<void> {
    await this.#presentGameDialog({});
  }

  async openGameEdit(game: IGame): Promise<void> {
    await this.#presentGameDialog({ gameId: game.id });
  }

  async openSettings(ev: Event): Promise<void> {
    const popover = await this.#popoverCtrl.create({
      component: TrackplayGameSettingsPopoverComponent,
      componentProps: { mode: 'games' },
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
