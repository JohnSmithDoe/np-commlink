import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonTitle,
  IonToggle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { FormField, SchemaFn, SchemaPathTree } from '@angular/forms/signals';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { closeCircle } from 'ionicons/icons';
import { BaseModalDialog } from '../../../@shared/feature/modal-dialog/base-modal-dialog';
import { requireText } from '../../../@shared/util/forms/form-rules';
import { GameType } from '../../model/trackplay.types';
import { TrackplayFacade } from '../../data';

type GameTypeForm = { name: string; winHigh: boolean };

const gameTypeRules: SchemaFn<GameTypeForm> = (path) => requireText(path.name);

@Component({
  selector: 'app-trackplay-game-type-edit-modal',
  templateUrl: './game-type-edit-modal.component.html',
  styleUrls: ['./game-type-edit-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormField,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonList,
    IonItem,
    IonInput,
    IonToggle,
    IonLabel,
    TranslatePipe,
  ],
})
export class TrackplayGameTypeEditModalComponent extends BaseModalDialog<
  GameType,
  GameTypeForm
> {
  readonly #facade = inject(TrackplayFacade);
  readonly #gameTypes = this.#facade.gameTypes;

  set gameTypeId(id: string | undefined) {
    this.editId.set(id);
  }

  protected readonly existing = computed<GameType | undefined>(() => {
    const id = this.editId();
    return id ? this.#gameTypes()[id] : undefined;
  });

  protected applyRules(path: SchemaPathTree<GameTypeForm>): void {
    gameTypeRules(path);
  }

  constructor() {
    super();
    addIcons({ closeCircle });
  }

  protected blank(): GameTypeForm {
    return { name: '', winHigh: true };
  }

  protected toForm(gameType: GameType): GameTypeForm {
    return { name: gameType.name, winHigh: gameType.winHigh };
  }

  protected persist(draft: GameTypeForm, existing: GameType | undefined): void {
    const name = draft.name.trim();
    if (existing) {
      this.#facade.updateGameType({
        ...existing,
        name,
        winHigh: draft.winHigh,
      });
    } else {
      this.#facade.createGameType(name, draft.winHigh);
    }
  }
}
