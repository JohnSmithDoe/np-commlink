import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  form,
  FormField,
  min,
  SchemaFn,
  validate,
} from '@angular/forms/signals';
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
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import dayjs from 'dayjs';
import { uuidv4 } from '../../../@shared/util/app.utils';
import { BaseModalDialog } from '../../../@shared/feature/modal-dialog/base-modal-dialog';
import {
  requireParseableDate,
  requireText,
} from '../../../@shared/util/form-rules';
import { CashFacade } from '../../data';
import { MoneyInputComponent } from '../../ui/money-input/money-input.component';
import { buildTransferLegs } from '../../util/transfer.utils';

type TTransferForm = {
  fromId: string;
  toId: string;
  amountCents: number | null;
  date: string;
  description: string;
};

const SAME_ACCOUNT = { kind: 'sameAccount' } as const;
const MISSING_AMOUNT = { kind: 'missingAmount' } as const;

// "Not into the account it came from" is a cross-field rule, and it belongs on
// the target: `valueOf` reads the source field's live value, so the error lands
// on the select the user would have to change.
const transferRules: SchemaFn<TTransferForm> = (path) => {
  requireText(path.fromId);
  requireText(path.toId);
  validate(path.toId, ({ value, valueOf }) =>
    value() && value() === valueOf(path.fromId) ? SAME_ACCOUNT : null
  );
  validate(path.amountCents, ({ value }) =>
    value() === null ? MISSING_AMOUNT : null
  );
  min(path.amountCents, 1);
  requireParseableDate(path.date);
};

/**
 * Book a transfer between two own accounts (via `ModalController`). Composes the
 * paired legs with `buildTransferLegs` and dispatches `Book Transfer`.
 *
 * Create-only: a transfer is a *pair* of new legs, not an editable entity, so
 * `existing` is always undefined and `toForm` is unreachable.
 */
@Component({
  selector: 'app-cash-transfer-modal',
  templateUrl: './transfer-modal.component.html',
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
    IonNote,
    IonSelect,
    IonSelectOption,
    TranslatePipe,
    MoneyInputComponent,
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

  protected readonly form = form(this.draft, transferRules);

  readonly sameAccount = computed(() =>
    this.form
      .toId()
      .errors()
      .some(({ kind }) => kind === SAME_ACCOUNT.kind)
  );
  // An untouched amount leaves the save disabled without being flagged; a box
  // holding something unusable says so.
  readonly amountInvalid = computed(() =>
    this.form
      .amountCents()
      .errors()
      .some(({ kind }) => kind !== MISSING_AMOUNT.kind)
  );
  readonly dateInvalid = computed(() => this.form.date().invalid());

  protected blank(): TTransferForm {
    return {
      fromId: '',
      toId: '',
      amountCents: null,
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
      draft.amountCents ?? 0,
      dayjs(draft.date).format(),
      description,
      uuidv4
    );
    this.#facade.bookTransfer(fromLeg, toLeg);
  }
}
