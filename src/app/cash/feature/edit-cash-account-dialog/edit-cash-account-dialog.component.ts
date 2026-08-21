import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { FormField, SchemaPathTree } from '@angular/forms/signals';
import {
  IonInput,
  IonItem,
  IonNote,
  IonSelect,
  IonSelectOption,
  IonToggle,
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import dayjs from 'dayjs';
import { BaseEditItemDialog } from '../../../@shared/feature/item-lists/edit-item-dialog/base-edit-item-dialog';
import { ItemListId } from '../../../@shared/model/item-list.types';
import { ItemEditModalComponent } from '../../../@shared/ui/base-item/item-edit-modal/item-edit-modal.component';
import { requireParseableDate } from '../../../@shared/util/forms/form-rules';
import {
  ACCOUNT_KIND_LABEL_KEYS,
  AccountKind,
  CashAccount,
} from '../../model/account.types';
import { CASH_ACCOUNTS_LIST_ID } from '../../model/cash.types';
import { CashAccountsFacade } from '../../data';
import { MoneyInputComponent } from '../../ui/money-input/money-input.component';
import { createCashAccount } from '../../util/cash.factory';

const ACCOUNT_KINDS = Object.keys(
  ACCOUNT_KIND_LABEL_KEYS
) as readonly AccountKind[];

type AccountForm = {
  name: string;
  kind: AccountKind;
  iban: string;
  openingBalanceCents: number | null;
  openingDate: string;
  excludedFromAllowance: boolean;
};

@Component({
  selector: 'app-edit-cash-account-dialog',
  templateUrl: './edit-cash-account-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormField,
    IonItem,
    IonInput,
    IonNote,
    IonSelect,
    IonSelectOption,
    IonToggle,
    TranslatePipe,
    ItemEditModalComponent,
    MoneyInputComponent,
  ],
})
export class EditCashAccountDialogComponent extends BaseEditItemDialog<
  CashAccount,
  AccountForm
> {
  readonly #facade = inject(CashAccountsFacade);

  protected readonly listId: ItemListId = CASH_ACCOUNTS_LIST_ID;
  readonly siblings = this.#facade.allItems;

  readonly kinds = ACCOUNT_KINDS;
  readonly kindLabelKeys = ACCOUNT_KIND_LABEL_KEYS;

  readonly balanceInvalid = computed(() =>
    this.form.openingBalanceCents().invalid()
  );
  readonly openingDateInvalid = computed(() =>
    this.form.openingDate().invalid()
  );

  protected override extraRules(path: SchemaPathTree<AccountForm>): void {
    requireParseableDate(path.openingDate);
  }

  protected blank(): CashAccount {
    return createCashAccount('');
  }

  protected override toForm(account: CashAccount): AccountForm {
    return {
      name: account.name,
      kind: account.kind,
      iban: account.iban ?? '',
      openingBalanceCents:
        account.openingBalanceCents === 0 ? null : account.openingBalanceCents,
      openingDate: dayjs(account.openingDateISO).format('YYYY-MM-DD'),
      excludedFromAllowance: account.excludedFromAllowance ?? false,
    };
  }

  protected override fromForm(
    draft: AccountForm,
    seed: CashAccount
  ): CashAccount {
    return {
      ...seed,
      name: draft.name.trim(),
      kind: draft.kind,
      iban: draft.iban.replaceAll(/\s/g, '').toUpperCase() || undefined,
      openingBalanceCents: draft.openingBalanceCents ?? 0,
      openingDateISO: dayjs(draft.openingDate).format(),
      excludedFromAllowance: draft.excludedFromAllowance || undefined,
    };
  }

  protected save(item: CashAccount): void {
    this.#facade.saveItem(item);
  }
}
