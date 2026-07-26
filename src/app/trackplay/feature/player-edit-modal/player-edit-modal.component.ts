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
  IonList,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { closeCircle } from 'ionicons/icons';
import { BaseModalDialog } from '../../../@shared/feature/modal-dialog/base-modal-dialog';
import { IPlayer } from '../../model/trackplay.types';
import { TrackplayFacade } from '../../data';

type TPlayerForm = { name: string };

/**
 * Player create/rename dialog (presented via ModalController). Port of the legacy
 * `player-edit` popover.
 */
@Component({
  selector: 'app-trackplay-player-edit-modal',
  templateUrl: './player-edit-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonList,
    IonItem,
    IonInput,
    TranslateModule,
  ],
})
export class TrackplayPlayerEditModalComponent extends BaseModalDialog<
  IPlayer,
  TPlayerForm
> {
  readonly #facade = inject(TrackplayFacade);
  readonly #players = this.#facade.players;

  /** Set imperatively via `componentProps`; undefined = create mode. */
  set playerId(id: string | undefined) {
    this.editId.set(id);
  }

  protected readonly existing = computed<IPlayer | undefined>(() => {
    const id = this.editId();
    return id ? this.#players()[id] : undefined;
  });

  readonly canSave = computed(() => this.draft().name.trim().length > 0);

  constructor() {
    super();
    // `close-circle` is the icon ion-input renders for its clear button.
    addIcons({ closeCircle });
  }

  protected blank(): TPlayerForm {
    return { name: '' };
  }

  protected toForm(player: IPlayer): TPlayerForm {
    return { name: player.name };
  }

  protected persist(draft: TPlayerForm, existing: IPlayer | undefined): void {
    const name = draft.name.trim();
    if (existing) {
      this.#facade.renamePlayer(existing.id, name);
    } else {
      this.#facade.createPlayer(name);
    }
  }

  onEnter(event: Event): void {
    (event.target as HTMLElement).blur();
    this.confirm();
  }
}
