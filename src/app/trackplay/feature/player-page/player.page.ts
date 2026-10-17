import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { IonButton, IonIcon } from '@ionic/angular';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import {
  addOutline,
  createOutline,
  eyeOutline,
  eyeOffOutline,
  playCircleOutline,
} from 'ionicons/icons';
import { Game, TrackplayId } from '../../model/trackplay.types';
import { ListPageComponent } from '../../../@shared/feature/item-lists/list-page/list-page.component';
import { LIST_FACADE } from '../../../@shared/util/item-lists/list-page.facade';
import { GameRowComponent } from '../../ui/game-row/game-row.component';
import { GamesForPlayerPageFacade } from '../../data';
import { EditGameDialogComponent } from '../edit-game-dialog/edit-game-dialog.component';
import { PEOPLE_ROUTE } from '../../../@shared/util/people/people.token';

@Component({
  selector: 'app-page-trackplay-player',
  templateUrl: './player.page.html',
  styleUrls: ['./player.page.scss'],
  imports: [
    IonButton,
    IonIcon,
    TranslatePipe,
    ListPageComponent,
    GameRowComponent,
    EditGameDialogComponent,
    RouterLink,
  ],
  providers: [{ provide: LIST_FACADE, useExisting: GamesForPlayerPageFacade }],
})
export class TrackplayPlayerPage {
  readonly #router = inject(Router);

  readonly facade = inject(GamesForPlayerPageFacade);
  readonly peopleRoute = PEOPLE_ROUTE;

  constructor() {
    addIcons({
      addOutline,
      createOutline,
      eyeOutline,
      eyeOffOutline,
      playCircleOutline,
    });
  }

  goToGame(gameId: TrackplayId): void {
    void this.#router.navigate(['/trackplay/games', gameId]);
  }

  deleteGame(game: Game): void {
    this.facade.removeItem(game);
  }

  openGameEdit(game: Game): void {
    this.facade.showEditDialog(game);
  }
}
