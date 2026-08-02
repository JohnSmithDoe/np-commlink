import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { FormField, SchemaFn, SchemaPathTree } from '@angular/forms/signals';
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
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { closeCircle, playCircle } from 'ionicons/icons';
import { BaseModalDialog } from '../../../@shared/feature/modal-dialog/base-modal-dialog';
import { requireText } from '../../../@shared/util/forms/form-rules';
import { Game, TrackplayId } from '../../model/trackplay.types';
import { TrackplayFacade } from '../../data';
import { DEFAULT_GAME_TYPE_ID } from '../../util/trackplay.factory';
import { TrackplayPlayerSelectComponent } from '../../ui/player-select/player-select.component';

type GameForm = { name: string; typeId: TrackplayId; playerIds: TrackplayId[] };

const gameRules: SchemaFn<GameForm> = (path) => requireText(path.name);

@Component({
  selector: 'app-trackplay-game-edit-modal',
  templateUrl: './game-edit-modal.component.html',
  styleUrls: ['./game-edit-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormField,
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
    TranslatePipe,
    TrackplayPlayerSelectComponent,
  ],
})
export class TrackplayGameEditModalComponent extends BaseModalDialog<
  Game,
  GameForm
> {
  readonly #facade = inject(TrackplayFacade);
  readonly #router = inject(Router);

  readonly #games = this.#facade.games;
  readonly #playersMap = this.#facade.players;
  readonly rxGameTypes = this.#facade.gameTypeList;
  readonly rxPlayers = computed(() =>
    Object.values(this.#playersMap()).toSorted((a, b) =>
      a.name.localeCompare(b.name)
    )
  );

  readonly #presetPlayerIds = signal<TrackplayId[] | undefined>(undefined);

  set gameId(id: string | undefined) {
    this.editId.set(id);
  }

  set presetPlayerIds(ids: TrackplayId[] | undefined) {
    this.#presetPlayerIds.set(ids);
  }

  protected readonly existing = computed<Game | undefined>(() => {
    const id = this.editId();
    return id ? this.#games()[id] : undefined;
  });

  readonly initialPlayerIds = computed<TrackplayId[]>(
    () => this.existing()?.players ?? this.#presetPlayerIds() ?? []
  );

  protected applyRules(path: SchemaPathTree<GameForm>): void {
    gameRules(path);
  }

  readonly canPlay = computed(
    () => this.canSave() && this.draft().playerIds.length > 0
  );

  constructor() {
    super();
    addIcons({ closeCircle, playCircle });
  }

  protected blank(): GameForm {
    return {
      name: '',
      typeId: DEFAULT_GAME_TYPE_ID,
      playerIds: this.#presetPlayerIds() ?? [],
    };
  }

  protected toForm(game: Game): GameForm {
    return { name: game.name, typeId: game.type, playerIds: game.players };
  }

  protected persist(draft: GameForm, existing: Game | undefined): void {
    this.#commit(draft, existing);
  }

  goToGame(): void {
    const id = this.#commit(this.draft(), this.existing());
    if (id) {
      void this.#router.navigate(['/trackplay/game', id]);
    }
    this.dismiss();
  }

  #commit(draft: GameForm, existing: Game | undefined): TrackplayId | null {
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
    return this.#facade.createGame(name, typeId, playerIds);
  }

  #hasSameIds(a: TrackplayId[], b: TrackplayId[]): boolean {
    return a.length === b.length && a.every((id, index) => id === b[index]);
  }
}
