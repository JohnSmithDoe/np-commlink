import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
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
  ModalController,
} from '@ionic/angular/standalone';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { closeCircle, playCircle } from 'ionicons/icons';
import { TID } from '../../../@shared/types';
import { TrackplayActions } from '../../data/trackplay.actions';
import {
  selectGames,
  selectGameTypeList,
  selectPlayers,
} from '../../data/trackplay.selector';
import { DEFAULT_GAME_TYPE_ID } from '../../util/trackplay.factory';
import { TrackplayPlayerSelectComponent } from '../../ui/player-select/player-select.component';

/**
 * Game create/edit dialog (presented via ModalController). `gameId` is an
 * imperative componentProp (plain property — Ionic assigns it before
 * `ngOnInit`): undefined = create, otherwise edit that game. In create mode an
 * optional `presetPlayerIds` pre-selects participants (used by "new game for
 * this player").
 *
 * Local signal state is seeded once from the store. Confirm commits every
 * changed field via its own store action; "go to game" commits first, then
 * navigates to the (existing or freshly-created) game. Port of the legacy
 * `game-edit` popover.
 */
@Component({
  selector: 'app-trackplay-game-edit-dialog',
  templateUrl: './game-edit-dialog.component.html',
  styleUrls: ['./game-edit-dialog.component.scss'],
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
export class TrackplayGameEditDialogComponent implements OnInit {
  readonly #store = inject(Store);
  readonly #modalCtrl = inject(ModalController);
  readonly #router = inject(Router);

  readonly #games = this.#store.selectSignal(selectGames);
  readonly #playersMap = this.#store.selectSignal(selectPlayers);
  readonly rxGameTypes = this.#store.selectSignal(selectGameTypeList);
  // Full roster (unaffected by the players-list filter) sorted by name, so any
  // player can always be (de)selected here.
  readonly rxPlayers = computed(() =>
    Object.values(this.#playersMap()).sort((a, b) =>
      a.name.localeCompare(b.name)
    )
  );

  /** Set imperatively via `componentProps`; undefined = create mode. */
  gameId?: string;
  /** Optional create-mode pre-selection. */
  presetPlayerIds?: TID[];

  readonly name = signal('');
  readonly typeId = signal<TID>(DEFAULT_GAME_TYPE_ID);
  // The original selection (stable) drives the player-select display order.
  readonly initialPlayerIds = signal<TID[]>([]);
  // The live draft, updated as the user toggles.
  readonly draftPlayerIds = signal<TID[]>([]);

  readonly isEdit = computed(() => !!this.gameId);
  readonly canSave = computed(() => this.name().trim().length > 0);
  readonly canPlay = computed(
    () => this.canSave() && this.draftPlayerIds().length > 0
  );

  constructor() {
    addIcons({ closeCircle, playCircle });
  }

  ngOnInit(): void {
    const existing = this.gameId ? this.#games()[this.gameId] : null;
    if (existing) {
      this.name.set(existing.name);
      this.typeId.set(existing.type);
      this.initialPlayerIds.set(existing.players);
      this.draftPlayerIds.set(existing.players);
    } else if (this.presetPlayerIds?.length) {
      this.initialPlayerIds.set(this.presetPlayerIds);
      this.draftPlayerIds.set(this.presetPlayerIds);
    }
  }

  onName(value: string): void {
    this.name.set(value);
  }

  onTypeChange(typeId: TID): void {
    this.typeId.set(typeId);
  }

  onPlayersChange(ids: TID[]): void {
    this.draftPlayerIds.set(ids);
  }

  confirm(): void {
    this.#commit();
    void this.#modalCtrl.dismiss();
  }

  goToGame(): void {
    const id = this.#commit();
    if (id) {
      void this.#router.navigate(['/trackplay/game', id]);
    }
    void this.#modalCtrl.dismiss();
  }

  cancel(): void {
    void this.#modalCtrl.dismiss();
  }

  // Apply every changed field and return the resolved game id (existing, or the
  // uuid of the just-created game — resolved by diffing the games map keys,
  // which NgRx updates synchronously on dispatch).
  #commit(): TID | null {
    const name = this.name().trim();
    const typeId = this.typeId();
    const players = this.draftPlayerIds();
    const existing = this.gameId ? this.#games()[this.gameId] : null;

    if (existing) {
      if (name && name !== existing.name) {
        this.#store.dispatch(TrackplayActions.renameGame(existing.id, name));
      }
      if (typeId !== existing.type) {
        this.#store.dispatch(
          TrackplayActions.changeGameType(existing.id, typeId)
        );
      }
      if (!this.#sameIds(players, existing.players)) {
        this.#store.dispatch(
          TrackplayActions.setGamePlayers(existing.id, players)
        );
      }
      return existing.id;
    }

    if (!name) return null;
    const before = new Set(Object.keys(this.#games()));
    this.#store.dispatch(TrackplayActions.createGame(name, players));
    const newId =
      Object.keys(this.#games()).find((id) => !before.has(id)) ?? null;
    if (newId && typeId !== DEFAULT_GAME_TYPE_ID) {
      this.#store.dispatch(TrackplayActions.changeGameType(newId, typeId));
    }
    return newId;
  }

  #sameIds(a: TID[], b: TID[]): boolean {
    return a.length === b.length && a.every((id, i) => id === b[i]);
  }
}
