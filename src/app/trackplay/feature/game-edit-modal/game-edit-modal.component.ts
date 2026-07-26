import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonList,
  IonListHeader,
  IonSelect,
  IonSelectOption,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { closeCircle, playCircle } from 'ionicons/icons';
import { BaseModalDialog } from '../../../@shared/feature/modal-dialog/base-modal-dialog';
import { IGame, TID } from '../../model/trackplay.types';
import { TrackplayFacade } from '../../data';
import { DEFAULT_GAME_TYPE_ID } from '../../util/trackplay.factory';
import { TrackplayPlayerSelectComponent } from '../../ui/player-select/player-select.component';

type TGameForm = { name: string; typeId: TID; playerIds: TID[] };

/**
 * Game create/edit dialog (presented via ModalController). In create mode an
 * optional `presetPlayerIds` pre-selects participants (used by "new game for this
 * player").
 *
 * Confirm commits every changed field via its own store action; "go to game"
 * commits first, then navigates to the (existing or freshly-created) game — which
 * is why it needs the resolved id and both paths share `#commit`. Port of the
 * legacy `game-edit` popover.
 */
@Component({
  selector: 'app-trackplay-game-edit-modal',
  templateUrl: './game-edit-modal.component.html',
  styleUrls: ['./game-edit-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonContent,
    IonList,
    IonListHeader,
    IonItem,
    IonInput,
    IonSelect,
    IonSelectOption,
    TranslateModule,
    TrackplayPlayerSelectComponent,
  ],
})
export class TrackplayGameEditModalComponent extends BaseModalDialog<
  IGame,
  TGameForm
> {
  readonly #facade = inject(TrackplayFacade);
  readonly #router = inject(Router);

  readonly #games = this.#facade.games;
  readonly #playersMap = this.#facade.players;
  readonly rxGameTypes = this.#facade.gameTypeList;
  // Full roster (unaffected by the players-list filter) sorted by name, so any
  // player can always be (de)selected here.
  readonly rxPlayers = computed(() =>
    Object.values(this.#playersMap()).toSorted((a, b) =>
      a.name.localeCompare(b.name)
    )
  );

  readonly #presetPlayerIds = signal<TID[] | undefined>(undefined);

  /** Set imperatively via `componentProps`; undefined = create mode. */
  set gameId(id: string | undefined) {
    this.editId.set(id);
  }

  /** Optional create-mode pre-selection. */
  set presetPlayerIds(ids: TID[] | undefined) {
    this.#presetPlayerIds.set(ids);
  }

  protected readonly existing = computed<IGame | undefined>(() => {
    const id = this.editId();
    return id ? this.#games()[id] : undefined;
  });

  // The ORIGINAL selection (stable) drives the player-select display order, so it
  // deliberately isn't part of the mutable draft.
  readonly initialPlayerIds = computed<TID[]>(
    () => this.existing()?.players ?? this.#presetPlayerIds() ?? []
  );

  readonly canSave = computed(() => this.draft().name.trim().length > 0);
  readonly canPlay = computed(
    () => this.canSave() && this.draft().playerIds.length > 0
  );

  constructor() {
    super();
    addIcons({ closeCircle, playCircle });
  }

  protected blank(): TGameForm {
    return {
      name: '',
      typeId: DEFAULT_GAME_TYPE_ID,
      playerIds: this.#presetPlayerIds() ?? [],
    };
  }

  protected toForm(game: IGame): TGameForm {
    return { name: game.name, typeId: game.type, playerIds: game.players };
  }

  protected persist(draft: TGameForm, existing: IGame | undefined): void {
    this.#commit(draft, existing);
  }

  goToGame(): void {
    const id = this.#commit(this.draft(), this.existing());
    if (id) {
      void this.#router.navigate(['/trackplay/game', id]);
    }
    this.dismiss();
  }

  // Apply every changed field and return the resolved game id (existing, or the
  // uuid of the just-created game — resolved by diffing the games map keys,
  // which NgRx updates synchronously on dispatch).
  #commit(draft: TGameForm, existing: IGame | undefined): TID | null {
    const name = draft.name.trim();
    const { typeId, playerIds } = draft;

    if (existing) {
      if (name && name !== existing.name) {
        this.#facade.renameGame(existing.id, name);
      }
      if (typeId !== existing.type) {
        this.#facade.changeGameType(existing.id, typeId);
      }
      if (!this.#hasSameIds(playerIds, existing.players)) {
        this.#facade.setGamePlayers(existing.id, playerIds);
      }
      return existing.id;
    }

    if (!name) {
      return null;
    }
    const before = new Set(Object.keys(this.#games()));
    this.#facade.createGame(name, playerIds);
    const newId =
      Object.keys(this.#games()).find((id) => !before.has(id)) ?? null;
    if (newId && typeId !== DEFAULT_GAME_TYPE_ID) {
      this.#facade.changeGameType(newId, typeId);
    }
    return newId;
  }

  #hasSameIds(a: TID[], b: TID[]): boolean {
    return a.length === b.length && a.every((id, index) => id === b[index]);
  }
}
