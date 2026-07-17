import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
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
  ModalController,
} from '@ionic/angular/standalone';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { closeCircle } from 'ionicons/icons';
import { TrackplayActions, selectPlayers } from '../../data';

/**
 * Player create/rename dialog (presented via ModalController). `playerId` is an
 * imperative componentProp (plain property — Ionic assigns it before
 * `ngOnInit`): undefined = create, otherwise rename that player. Local signal
 * state is seeded once from the store; confirm dispatches create/rename then
 * dismisses. Port of the legacy `player-edit` popover.
 */
@Component({
  selector: 'app-trackplay-player-edit-dialog',
  templateUrl: './player-edit-dialog.component.html',
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
export class TrackplayPlayerEditDialogComponent implements OnInit {
  readonly #store = inject(Store);
  readonly #modalCtrl = inject(ModalController);
  readonly #players = this.#store.selectSignal(selectPlayers);

  /** Set imperatively via `componentProps`; undefined = create mode. */
  playerId?: string;

  readonly name = signal('');
  readonly canSave = computed(() => this.name().trim().length > 0);

  constructor() {
    // `close-circle` is the icon ion-input renders for its clear button.
    addIcons({ closeCircle });
  }

  ngOnInit(): void {
    const existing = this.playerId ? this.#players()[this.playerId] : null;
    if (existing) {
      this.name.set(existing.name);
    }
  }

  onName(value: string): void {
    this.name.set(value);
  }

  onEnter(ev: Event): void {
    (ev.target as HTMLElement).blur();
    this.confirm();
  }

  confirm(): void {
    const name = this.name().trim();
    if (!name) return;
    const existing = this.playerId ? this.#players()[this.playerId] : null;
    if (existing) {
      this.#store.dispatch(TrackplayActions.renamePlayer(existing.id, name));
    } else {
      this.#store.dispatch(TrackplayActions.createPlayer(name));
    }
    void this.#modalCtrl.dismiss();
  }

  cancel(): void {
    void this.#modalCtrl.dismiss();
  }
}
