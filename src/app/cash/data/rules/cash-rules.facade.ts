import { inject, Injectable } from '@angular/core';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { Store } from '@ngrx/store';
import { NotificationsActions } from '../../../@shared/data/actions/notifications.actions';
import { ItemDialogService } from '../../../@shared/data/item-lists/item-dialog.service';
import { CASH_RULES_LIST_ID } from '../../model/cash.types';
import { CashRule } from '../../model/rule.types';
import { CashTransaction } from '../../model/transaction.types';
import { createCashRule } from '../../util/cash.factory';
import { ruleFrom } from '../../util/derive.utils';
import { CashRulesActions } from './cash-rules.actions';
import {
  selectRuleItems,
  selectRulesListItems,
  selectRuleStats,
} from './cash-rules.selector';

@Injectable({ providedIn: 'root' })
export class CashRulesFacade {
  readonly #store = inject(Store);
  readonly #dialogs = inject(ItemDialogService);

  showCreateDialog(): void {
    this.#openCreate(createCashRule('', '', this.#nextOrder()));
  }

  deriveFrom(txn: CashTransaction): void {
    this.#openCreate(ruleFrom(txn, this.#nextOrder()));
  }

  #openCreate(item: CashRule): void {
    this.#dialogs.open({
      item,
      listId: CASH_RULES_LIST_ID,
      editMode: 'create',
    });
  }

  #nextOrder(): number {
    return Math.max(-1, ...this.allItems().map((rule) => rule.order)) + 1;
  }

  showEditDialog(item: CashRule): void {
    this.#dialogs.open({
      item,
      listId: CASH_RULES_LIST_ID,
      editMode: 'update',
    });
  }

  readonly allItems = this.#store.selectSignal(selectRuleItems);
  readonly listItems = this.#store.selectSignal(selectRulesListItems);
  readonly stats = this.#store.selectSignal(selectRuleStats);

  saveItem(item: CashRule): void {
    const isKnown = this.allItems().some(({ id }) => id === item.id);
    this.#store.dispatch(
      isKnown
        ? CashRulesActions.updateItem(item)
        : CashRulesActions.addItem(item)
    );
  }

  removeItem(item: CashRule): void {
    this.#store.dispatch(CashRulesActions.removeItem(item));
  }

  reorder(ids: string[]): void {
    this.#store.dispatch(CashRulesActions.reorder(ids));
  }

  reportRulesApplied(count: number): void {
    this.#store.dispatch(
      NotificationsActions.toast({
        key: marker('cash.rules.apply-result'),
        parameters: { count },
        color: 'medium',
      })
    );
  }
}
