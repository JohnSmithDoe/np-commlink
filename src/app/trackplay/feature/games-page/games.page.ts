import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { IonButton, IonIcon } from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import {
  create,
  diceOutline,
  eye,
  eyeOff,
  peopleOutline,
  playCircle,
} from 'ionicons/icons';
import { Game, TrackplayId } from '../../model/trackplay.types';
import { ListPageComponent } from '../../../@shared/feature/item-lists/list-page/list-page.component';
import { LIST_FACADE } from '../../../@shared/util/item-lists/list-page.facade';
import { GameRowComponent } from '../../ui/game-row/game-row.component';
import { GamesFacade, GamesPageFacade } from '../../data';
import { EditGameDialogComponent } from '../edit-game-dialog/edit-game-dialog.component';

@Component({
  selector: 'app-page-trackplay-games',
  templateUrl: './games.page.html',
  styleUrls: ['./games.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonButton,
    IonIcon,
    RouterLink,
    TranslatePipe,
    ListPageComponent,
    GameRowComponent,
    EditGameDialogComponent,
  ],
  providers: [{ provide: LIST_FACADE, useExisting: GamesPageFacade }],
})
export class TrackplayGamesPage {
  readonly facade = inject(GamesPageFacade);
  readonly #games = inject(GamesFacade);
  readonly #router = inject(Router);

  constructor() {
    addIcons({ create, diceOutline, eye, eyeOff, peopleOutline, playCircle });
  }

  goToGame(id: TrackplayId): void {
    void this.#router.navigate(['/trackplay/game', id]);
  }

  deleteGame(game: Game): void {
    this.#games.removeItem(game);
  }

  openGameEdit(game: Game): void {
    this.#games.showEditDialog(game);
  }
}
