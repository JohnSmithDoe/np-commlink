import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { IonNote } from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { create, peopleOutline, person } from 'ionicons/icons';
import { Player, PlayerStats, TrackplayId } from '../../model/trackplay.types';
import { ListPageComponent } from '../../../@shared/feature/item-lists/list-page/list-page.component';
import { LIST_FACADE } from '../../../@shared/util/item-lists/list-page.facade';
import { ListItemComponent } from '../../../@shared/ui/base-item/list-item/list-item.component';
import { TRACKPLAY_EDIT_SWIPE_ACTION } from '../../ui/swipe-actions';
import { PlayersFacade, PlayersPageFacade } from '../../data';
import { EditPlayerDialogComponent } from '../edit-player-dialog/edit-player-dialog.component';
import { NO_PLAYER_STATS } from '../../util/trackplay.factory';

@Component({
  selector: 'app-page-trackplay-players',
  templateUrl: './players.page.html',
  styleUrls: ['./players.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    IonNote,
    TranslatePipe,
    ListPageComponent,
    ListItemComponent,
    EditPlayerDialogComponent,
  ],
  providers: [{ provide: LIST_FACADE, useExisting: PlayersPageFacade }],
})
export class TrackplayPlayersPage {
  readonly editSwipeAction = TRACKPLAY_EDIT_SWIPE_ACTION;

  readonly #players = inject(PlayersFacade);
  readonly #router = inject(Router);

  readonly stats = this.#players.stats;

  constructor() {
    addIcons({ create, peopleOutline, person });
  }

  statsFor(player: Player): PlayerStats {
    return this.stats()[player.id] ?? NO_PLAYER_STATS;
  }

  goToPlayer(id: TrackplayId): void {
    void this.#router.navigate(['/trackplay/player', id]);
  }

  deletePlayer(player: Player): void {
    this.#players.removeItem(player);
  }

  openPlayerEdit(player: Player): void {
    this.#players.showEditDialog(player);
  }
}
