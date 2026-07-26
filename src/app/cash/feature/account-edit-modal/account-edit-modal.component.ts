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
  IonNote,
  IonSelect,
  IonSelectOption,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import dayjs from 'dayjs';
import { BaseModalDialog } from '../../../@shared/feature/modal-dialog/base-modal-dialog';
import { uuidv4 } from '../../../@shared/util/app.utils';
import { ICashAccount, TAccountKind, TBank } from '../../model/account.types';
import { CashFacade } from '../../data';
import { centsToInput, eurToCents } from '../../util/money.utils';
import { BANK_OPTIONS } from '../../util/import/bank-parsers';

const ACCOUNT_KINDS: readonly TAccountKind[] = [
  'giro',
  'creditcard',
  'savings',
  'cash',
];

// Rendered dynamically ('cash.account.kind.' + k, 'cash.bank.' + b | translate),
// so the extractor can't see them — register each concrete key explicitly.
marker('cash.account.kind.giro');
marker('cash.account.kind.creditcard');
marker('cash.account.kind.savings');
marker('cash.account.kind.cash');
marker('cash.bank.volksbank');
marker('cash.bank.dkb');

// The opening balance is edited as a raw de-DE string and the bank as '' rather
// than undefined, so the form is a view-model over ICashAccount, not a copy.
type TAccountForm = {
  name: string;
  kind: TAccountKind;
  bank: TBank | '';
  openingBalance: string;
  openingDate: string;
};

/** Create/edit a cash account, presented via `ModalController`. */
@Component({
  selector: 'app-cash-account-edit-modal',
  templateUrl: './account-edit-modal.component.html',
  styleUrls: ['./account-edit-modal.component.scss'],
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
export class CashAccountEditModalComponent extends BaseModalDialog<
  ICashAccount,
  TAccountForm
> {
  readonly #facade = inject(CashFacade);
  readonly #accounts = this.#facade.accounts;

  readonly kinds = ACCOUNT_KINDS;
  readonly banks = BANK_OPTIONS;

  /** Set imperatively via `componentProps`; undefined = create mode. */
  set accountId(id: string | undefined) {
    this.editId.set(id);
  }

  protected readonly existing = computed<ICashAccount | undefined>(() => {
    const id = this.editId();
    return id
      ? this.#accounts().find((account) => account.id === id)
      : undefined;
  });

  readonly #parsedCents = computed(() =>
    eurToCents(this.draft().openingBalance)
  );
  // Empty is allowed and means "0"; otherwise it must parse.
  readonly balanceInvalid = computed(
    () =>
      this.draft().openingBalance.trim() !== '' && this.#parsedCents() === null
  );
  // Same trap as the transaction modal: a cleared date would persist the
  // string 'Invalid Date' as `openingDateISO`.
  readonly openingDateInvalid = computed(
    () => !dayjs(this.draft().openingDate).isValid()
  );
  readonly canSave = computed(
    () =>
      this.draft().name.trim().length > 0 &&
      !this.balanceInvalid() &&
      !this.openingDateInvalid()
  );

  protected blank(): TAccountForm {
    return {
      name: '',
      kind: 'giro',
      bank: '',
      openingBalance: '',
      openingDate: dayjs().format('YYYY-MM-DD'),
    };
  }

  protected toForm(account: ICashAccount): TAccountForm {
    return {
      name: account.name,
      kind: account.kind,
      bank: account.bank ?? '',
      openingBalance:
        account.openingBalanceCents === 0
          ? ''
          : centsToInput(account.openingBalanceCents),
      openingDate: dayjs(account.openingDateISO).format('YYYY-MM-DD'),
    };
  }

  protected persist(
    draft: TAccountForm,
    existing: ICashAccount | undefined
  ): void {
    const fields = {
      name: draft.name.trim(),
      kind: draft.kind,
      bank: draft.bank || undefined,
      openingBalanceCents: this.#parsedCents() ?? 0,
      openingDateISO: dayjs(draft.openingDate).format(),
    };
    if (existing) {
      this.#facade.updateAccount({ ...existing, ...fields });
    } else {
      this.#facade.addAccount({
        id: uuidv4(),
        ...fields,
        createdAt: dayjs().format(),
      });
    }
  }
}
