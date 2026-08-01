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
import { IGameType } from '../../model/trackplay.types';
import { TrackplayFacade } from '../../data';

type TGameTypeForm = { name: string; winHigh: boolean };

const gameTypeRules: SchemaFn<TGameTypeForm> = (path) => requireText(path.name);

/**
 * Game-type create/edit dialog (presented via ModalController). Port of the legacy
 * `game-type-edit` popover.
 */
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
  IGameType,
  TGameTypeForm
> {
  readonly #facade = inject(TrackplayFacade);
  readonly #gameTypes = this.#facade.gameTypes;

  /** Set imperatively via `componentProps`; undefined = create mode. */
  set gameTypeId(id: string | undefined) {
    this.editId.set(id);
  }

  protected readonly existing = computed<IGameType | undefined>(() => {
    const id = this.editId();
    return id ? this.#gameTypes()[id] : undefined;
  });

  protected applyRules(path: SchemaPathTree<TGameTypeForm>): void {
    gameTypeRules(path);
  }

  constructor() {
    super();
    // `close-circle` is the icon ion-input renders for its clear button.
    addIcons({ closeCircle });
  }

  protected blank(): TGameTypeForm {
    return { name: '', winHigh: true };
  }

  protected toForm(gameType: IGameType): TGameTypeForm {
    return { name: gameType.name, winHigh: gameType.winHigh };
  }

  protected persist(
    draft: TGameTypeForm,
    existing: IGameType | undefined
  ): void {
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
