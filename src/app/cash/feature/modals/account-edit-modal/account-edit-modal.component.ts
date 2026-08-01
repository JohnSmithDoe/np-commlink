import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { FormField, SchemaFn, SchemaPathTree } from '@angular/forms/signals';
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
import { TranslatePipe } from '@ngx-translate/core';
import dayjs from 'dayjs';
import { BaseModalDialog } from '../../../../@shared/feature/modal-dialog/base-modal-dialog';
import {
  requireParseableDate,
  requireText,
} from '../../../../@shared/util/forms/form-rules';
import { uuidv4 } from '../../../../@shared/util/app.utils';
import {
  ACCOUNT_KIND_LABEL_KEYS,
  BANK_LABEL_KEYS,
  ICashAccount,
  TAccountKind,
  TBank,
} from '../../../model/account.types';
import { CashFacade } from '../../../data';
import { MoneyInputComponent } from '../../../ui/money-input/money-input.component';
import { BANK_OPTIONS } from '../../../util/import/bank-parsers';

// The picker's rows are the label table's keys, so a new kind cannot ship
// labelled but unofferable.
const ACCOUNT_KINDS = Object.keys(
  ACCOUNT_KIND_LABEL_KEYS
) as readonly TAccountKind[];

// An unset bank is '' rather than undefined and a zero opening balance is null
// (so the box reads empty, not `0,00`), so the form is a view-model over
// ICashAccount, not a copy.
type TAccountForm = {
  name: string;
  kind: TAccountKind;
  bank: TBank | '';
  openingBalanceCents: number | null;
  openingDate: string;
};

// The opening balance carries NO rule of its own: empty means zero and a
// negative balance is a credit card, so the only thing that can be wrong with it
// is text that isn't an amount — which `app-money-input` reports itself.
const accountRules: SchemaFn<TAccountForm> = (path) => {
  requireText(path.name);
  requireParseableDate(path.openingDate);
};

/** Create/edit a cash account, presented via `ModalController`. */
@Component({
  selector: 'app-cash-account-edit-modal',
  templateUrl: './account-edit-modal.component.html',
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
export class CashAccountEditModalComponent extends BaseModalDialog<
  ICashAccount,
  TAccountForm
> {
  readonly #facade = inject(CashFacade);
  readonly #accounts = this.#facade.accounts;

  readonly kinds = ACCOUNT_KINDS;
  readonly banks = BANK_OPTIONS;
  readonly kindLabelKeys = ACCOUNT_KIND_LABEL_KEYS;
  readonly bankLabelKeys = BANK_LABEL_KEYS;

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

  protected applyRules(path: SchemaPathTree<TAccountForm>): void {
    accountRules(path);
  }

  readonly balanceInvalid = computed(() =>
    this.form.openingBalanceCents().invalid()
  );
  readonly openingDateInvalid = computed(() =>
    this.form.openingDate().invalid()
  );

  protected blank(): TAccountForm {
    return {
      name: '',
      kind: 'giro',
      bank: '',
      openingBalanceCents: null,
      openingDate: dayjs().format('YYYY-MM-DD'),
    };
  }

  protected toForm(account: ICashAccount): TAccountForm {
    return {
      name: account.name,
      kind: account.kind,
      bank: account.bank ?? '',
      openingBalanceCents:
        account.openingBalanceCents === 0 ? null : account.openingBalanceCents,
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
      openingBalanceCents: draft.openingBalanceCents ?? 0,
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
