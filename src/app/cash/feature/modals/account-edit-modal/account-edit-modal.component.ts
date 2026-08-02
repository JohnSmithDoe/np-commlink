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
  AccountKind,
  Bank,
  BANK_LABEL_KEYS,
  CashAccount,
} from '../../../model/account.types';
import { CashFacade } from '../../../data';
import { MoneyInputComponent } from '../../../ui/money-input/money-input.component';
import { BANK_OPTIONS } from '../../../util/import/bank-parsers';

const ACCOUNT_KINDS = Object.keys(
  ACCOUNT_KIND_LABEL_KEYS
) as readonly AccountKind[];

type AccountForm = {
  name: string;
  kind: AccountKind;
  bank: Bank | '';
  openingBalanceCents: number | null;
  openingDate: string;
};

const accountRules: SchemaFn<AccountForm> = (path) => {
  requireText(path.name);
  requireParseableDate(path.openingDate);
};

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
  CashAccount,
  AccountForm
> {
  readonly #facade = inject(CashFacade);
  readonly #accounts = this.#facade.accounts;

  readonly kinds = ACCOUNT_KINDS;
  readonly banks = BANK_OPTIONS;
  readonly kindLabelKeys = ACCOUNT_KIND_LABEL_KEYS;
  readonly bankLabelKeys = BANK_LABEL_KEYS;

  set accountId(id: string | undefined) {
    this.editId.set(id);
  }

  protected readonly existing = computed<CashAccount | undefined>(() => {
    const id = this.editId();
    return id
      ? this.#accounts().find((account) => account.id === id)
      : undefined;
  });

  protected applyRules(path: SchemaPathTree<AccountForm>): void {
    accountRules(path);
  }

  readonly balanceInvalid = computed(() =>
    this.form.openingBalanceCents().invalid()
  );
  readonly openingDateInvalid = computed(() =>
    this.form.openingDate().invalid()
  );

  protected blank(): AccountForm {
    return {
      name: '',
      kind: 'giro',
      bank: '',
      openingBalanceCents: null,
      openingDate: dayjs().format('YYYY-MM-DD'),
    };
  }

  protected toForm(account: CashAccount): AccountForm {
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
    draft: AccountForm,
    existing: CashAccount | undefined
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
