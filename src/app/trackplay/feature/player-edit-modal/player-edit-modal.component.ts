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
import { FormField, SchemaFn, SchemaPathTree } from '@angular/forms/signals';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { closeCircle } from 'ionicons/icons';
import { BaseModalDialog } from '../../../@shared/feature/modal-dialog/base-modal-dialog';
import { requireText } from '../../../@shared/util/forms/form-rules';
import { Player } from '../../model/trackplay.types';
import { TrackplayFacade } from '../../data';

type PlayerForm = { name: string };

const playerRules: SchemaFn<PlayerForm> = (path) => requireText(path.name);

@Component({
  selector: 'app-trackplay-player-edit-modal',
  templateUrl: './player-edit-modal.component.html',
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
    TranslatePipe,
  ],
})
export class TrackplayPlayerEditModalComponent extends BaseModalDialog<
  Player,
  PlayerForm
> {
  readonly #facade = inject(TrackplayFacade);
  readonly #players = this.#facade.players;

  set playerId(id: string | undefined) {
    this.editId.set(id);
  }

  protected readonly existing = computed<Player | undefined>(() => {
    const id = this.editId();
    return id ? this.#players()[id] : undefined;
  });

  protected applyRules(path: SchemaPathTree<PlayerForm>): void {
    playerRules(path);
  }

  constructor() {
    super();
    addIcons({ closeCircle });
  }

  protected blank(): PlayerForm {
    return { name: '' };
  }

  protected toForm(player: Player): PlayerForm {
    return { name: player.name };
  }

  protected persist(draft: PlayerForm, existing: Player | undefined): void {
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
