import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonButton, IonIcon } from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import {
  addOutline,
  create,
  createOutline,
  eye,
  eyeOff,
  playCircle,
} from 'ionicons/icons';
import { Game, TrackplayId } from '../../model/trackplay.types';
import { ListPageComponent } from '../../../@shared/feature/item-lists/list-page/list-page.component';
import { LIST_FACADE } from '../../../@shared/util/item-lists/list-page.facade';
import { GameRowComponent } from '../../ui/game-row/game-row.component';
import { GamesForPlayerPageFacade } from '../../data';
import { EditGameDialogComponent } from '../edit-game-dialog/edit-game-dialog.component';
import { EditPlayerDialogComponent } from '../edit-player-dialog/edit-player-dialog.component';

@Component({
  selector: 'app-page-trackplay-player',
  templateUrl: './player.page.html',
  styleUrls: ['./player.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonButton,
    IonIcon,
    TranslatePipe,
    ListPageComponent,
    GameRowComponent,
    EditGameDialogComponent,
    EditPlayerDialogComponent,
  ],
  providers: [{ provide: LIST_FACADE, useExisting: GamesForPlayerPageFacade }],
})
export class TrackplayPlayerPage {
  readonly facade = inject(GamesForPlayerPageFacade);
  readonly #router = inject(Router);

  constructor() {
    addIcons({ addOutline, create, createOutline, eye, eyeOff, playCircle });
  }

  goToGame(gameId: TrackplayId): void {
    void this.#router.navigate(['/trackplay/game', gameId]);
  }

  deleteGame(game: Game): void {
    this.facade.removeItem(game);
  }

  openGameEdit(game: Game): void {
    this.facade.showEditDialog(game);
  }
}
