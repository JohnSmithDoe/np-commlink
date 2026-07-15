import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
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
  IonNote,
  IonSelect,
  IonSelectOption,
  IonTitle,
  IonToolbar,
  ModalController,
} from '@ionic/angular/standalone';
import { Store } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import dayjs from 'dayjs';
import { uuidv4 } from '../../../@shared/util/app.utils';
import { CashActions } from '../../data/cash.actions';
import { selectCashAccounts } from '../../data/cash.selector';
import { eurToCents } from '../../util/money';
import { buildTransferLegs } from '../../util/transfer';

/**
 * Book a transfer between two own accounts (via `ModalController`). Composes the
 * paired legs with `buildTransferLegs` and dispatches `Book Transfer`. Guarded
 * so source and target must differ and the amount must parse to a positive value.
 */
@Component({
  selector: 'app-cash-transfer-modal',
  templateUrl: './transfer-modal.component.html',
  styleUrls: ['./transfer-modal.component.scss'],
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
    IonNote,
    IonSelect,
    IonSelectOption,
    TranslateModule,
  ],
})
export class CashTransferModalComponent {
  readonly #store = inject(Store);
  readonly #modalCtrl = inject(ModalController);
  readonly #translate = inject(TranslateService);

  readonly accounts = this.#store.selectSignal(selectCashAccounts);

  readonly fromId = signal('');
  readonly toId = signal('');
  readonly amount = signal('');
  readonly date = signal(dayjs().format('YYYY-MM-DD'));
  readonly description = signal('');

  readonly #cents = computed(() => eurToCents(this.amount()));
  readonly amountInvalid = computed(() => {
    const cents = this.#cents();
    return this.amount().trim() !== '' && (cents === null || cents <= 0);
  });
  readonly sameAccount = computed(
    () => !!this.fromId() && this.fromId() === this.toId()
  );
  readonly canSave = computed(() => {
    const cents = this.#cents();
    return (
      !!this.fromId() &&
      !!this.toId() &&
      !this.sameAccount() &&
      cents !== null &&
      cents > 0
    );
  });

  onFrom(value: string): void {
    this.fromId.set(value);
  }

  onTo(value: string): void {
    this.toId.set(value);
  }

  onAmount(value: string): void {
    this.amount.set(value);
  }

  onDate(value: string): void {
    this.date.set(value);
  }

  onDescription(value: string): void {
    this.description.set(value);
  }

  save(): void {
    if (!this.canSave()) return;
    const description =
      this.description().trim() ||
      this.#translate.instant(marker('cash.transfer.default-description'));
    const [fromLeg, toLeg] = buildTransferLegs(
      this.fromId(),
      this.toId(),
      this.#cents() ?? 0,
      dayjs(this.date()).format(),
      description,
      uuidv4
    );
    this.#store.dispatch(CashActions.bookTransfer(fromLeg, toLeg));
    void this.#modalCtrl.dismiss();
  }

  cancel(): void {
    void this.#modalCtrl.dismiss();
  }
}
