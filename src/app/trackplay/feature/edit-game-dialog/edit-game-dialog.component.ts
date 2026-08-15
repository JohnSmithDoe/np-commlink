/* ─── why ─────────────────────────────────────────────────────────
 * "Weiter" no longer re-saves to learn the id. A `Game` is a `BaseItem`
 * now, so the draft already carries the id it will be stored under —
 * saving and navigating are two independent steps over one known id.
 * ───────────────────────────────────────────────────────────────── */

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { Router } from '@angular/router';
import {
  IonButton,
  IonIcon,
  IonItem,
  IonListHeader,
  IonSelect,
  IonSelectOption,
  SelectCustomEvent,
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { playCircle } from 'ionicons/icons';
import { BaseEditItemDialog } from '../../../@shared/feature/item-lists/edit-item-dialog/base-edit-item-dialog';
import { ItemListId } from '../../../@shared/model/item-list.types';
import { ItemEditModalComponent } from '../../../@shared/ui/base-item/item-edit-modal/item-edit-modal.component';
import { GamesFacade, GameTypesFacade, PlayersFacade } from '../../data';
import { Game, GAMES_LIST_ID, TrackplayId } from '../../model/trackplay.types';
import { gameTypeIdOf } from '../../util/game-type.utils';
import { createGame } from '../../util/trackplay.factory';
import { TrackplayPlayerSelectComponent } from '../../ui/player-select/player-select.component';

@Component({
  selector: 'app-edit-game-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './edit-game-dialog.component.html',
  styleUrls: ['./edit-game-dialog.component.scss'],
  imports: [
    IonButton,
    IonIcon,
    IonItem,
    IonListHeader,
    IonSelect,
    IonSelectOption,
    TranslatePipe,
    ItemEditModalComponent,
    TrackplayPlayerSelectComponent,
  ],
})
export class EditGameDialogComponent extends BaseEditItemDialog<Game> {
  readonly #games = inject(GamesFacade);
  readonly #players = inject(PlayersFacade);
  readonly #router = inject(Router);

  protected readonly listId: ItemListId = GAMES_LIST_ID;
  readonly siblings = this.#games.allItems;

  readonly gameTypes = inject(GameTypesFacade).items;
  readonly players = computed(() =>
    this.#players.allItems().toSorted((a, b) => a.name.localeCompare(b.name))
  );

  readonly gameTypeId = computed(() => gameTypeIdOf(this.draft()));
  readonly seedPlayerIds = computed(() => this.seedItem()?.playerIds ?? []);
  readonly canPlay = computed(
    () => this.canSave() && this.draft().playerIds.length > 0
  );

  constructor() {
    super();
    addIcons({ playCircle });
  }

  protected blank(): Game {
    return createGame('');
  }

  protected save(item: Game): void {
    this.#games.saveItem(item);
  }

  setGameType(event: SelectCustomEvent<TrackplayId>): void {
    this.patch({ categoryIds: [event.detail.value] });
  }

  setPlayers(playerIds: TrackplayId[]): void {
    this.patch({ playerIds });
  }

  playNow(): void {
    if (!this.canPlay()) {
      return;
    }
    const { id } = this.draft();
    this.confirm();
    void this.#router.navigate(['/trackplay/game', id]);
  }
}
