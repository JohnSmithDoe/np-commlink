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
} from '@ionic/angular/standalone';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import dayjs from 'dayjs';
import { uuidv4 } from '../../../@shared/util/app.utils';
import { BaseModalDialog } from '../../../@shared/feature/modal-dialog/base-modal-dialog';
import { CashFacade } from '../../data';
import { eurToCents } from '../../util/money.utils';
import { buildTransferLegs } from '../../util/transfer.utils';

type TTransferForm = {
  fromId: string;
  toId: string;
  amount: string;
  date: string;
  description: string;
};

/**
 * Book a transfer between two own accounts (via `ModalController`). Composes the
 * paired legs with `buildTransferLegs` and dispatches `Book Transfer`. Guarded
 * so source and target must differ and the amount must parse to a positive value.
 *
 * Create-only: a transfer is a *pair* of new legs, not an editable entity, so
 * `existing` is always undefined and `toForm` is unreachable.
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
export class CashTransferModalComponent extends BaseModalDialog<
  never,
  TTransferForm
> {
  readonly #facade = inject(CashFacade);
  readonly #translate = inject(TranslateService);

  readonly accounts = this.#facade.accounts;

  protected readonly existing = signal<never | undefined>(undefined);

  readonly #cents = computed(() => eurToCents(this.draft().amount));
  readonly amountInvalid = computed(() => {
    const cents = this.#cents();
    return this.draft().amount.trim() !== '' && (cents === null || cents <= 0);
  });
  readonly sameAccount = computed(
    () => !!this.draft().fromId && this.draft().fromId === this.draft().toId
  );
  readonly canSave = computed(() => {
    const cents = this.#cents();
    return (
      !!this.draft().fromId &&
      !!this.draft().toId &&
      !this.sameAccount() &&
      cents !== null &&
      cents > 0
    );
  });

  protected blank(): TTransferForm {
    return {
      fromId: '',
      toId: '',
      amount: '',
      date: dayjs().format('YYYY-MM-DD'),
      description: '',
    };
  }

  protected toForm(): TTransferForm {
    return this.blank();
  }

  protected persist(draft: TTransferForm): void {
    const description =
      draft.description.trim() ||
      this.#translate.instant(marker('cash.transfer.default-description'));
    const [fromLeg, toLeg] = buildTransferLegs(
      draft.fromId,
      draft.toId,
      this.#cents() ?? 0,
      dayjs(draft.date).format(),
      description,
      uuidv4
    );
    this.#facade.bookTransfer(fromLeg, toLeg);
  }
}
