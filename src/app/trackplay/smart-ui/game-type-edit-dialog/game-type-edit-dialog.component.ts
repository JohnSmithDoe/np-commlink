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
  IonLabel,
  IonList,
  IonTitle,
  IonToggle,
  IonToolbar,
  ModalController,
} from '@ionic/angular/standalone';
import { ToggleChangeEventDetail } from '@ionic/angular';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { closeCircle } from 'ionicons/icons';
import { TrackplayActions, selectGameTypes } from '../../data';

/**
 * Game-type create/edit dialog (presented via ModalController). `gameTypeId` is
 * an imperative componentProp (plain property — Ionic assigns it before
 * `ngOnInit`): undefined = create, otherwise edit that type. Local signal state
 * is seeded once from the store; confirm dispatches create/update then dismisses.
 * Port of the legacy `game-type-edit` popover.
 */
@Component({
  selector: 'app-trackplay-game-type-edit-dialog',
  templateUrl: './game-type-edit-dialog.component.html',
  styleUrls: ['./game-type-edit-dialog.component.scss'],
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
    IonToggle,
    IonLabel,
    TranslateModule,
  ],
})
export class TrackplayGameTypeEditDialogComponent implements OnInit {
  readonly #store = inject(Store);
  readonly #modalCtrl = inject(ModalController);
  readonly #gameTypes = this.#store.selectSignal(selectGameTypes);

  /** Set imperatively via `componentProps`; undefined = create mode. */
  gameTypeId?: string;

  readonly name = signal('');
  readonly winHigh = signal(true);
  readonly canSave = computed(() => this.name().trim().length > 0);

  constructor() {
    // `close-circle` is the icon ion-input renders for its clear button.
    addIcons({ closeCircle });
  }

  ngOnInit(): void {
    const existing = this.gameTypeId
      ? this.#gameTypes()[this.gameTypeId]
      : null;
    if (existing) {
      this.name.set(existing.name);
      this.winHigh.set(existing.winHigh);
    }
  }

  onName(value: string): void {
    this.name.set(value);
  }

  onWinHigh(detail: ToggleChangeEventDetail): void {
    this.winHigh.set(detail.checked);
  }

  confirm(): void {
    const name = this.name().trim();
    if (!name) return;
    const winHigh = this.winHigh();
    const existing = this.gameTypeId
      ? this.#gameTypes()[this.gameTypeId]
      : null;
    if (existing) {
      this.#store.dispatch(
        TrackplayActions.updateGameType({ ...existing, name, winHigh })
      );
    } else {
      this.#store.dispatch(TrackplayActions.createGameType(name, winHigh));
    }
    void this.#modalCtrl.dismiss();
  }

  cancel(): void {
    void this.#modalCtrl.dismiss();
  }
}
