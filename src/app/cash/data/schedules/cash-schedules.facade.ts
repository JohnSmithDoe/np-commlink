import { computed, inject, Injectable, signal } from '@angular/core';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { Store } from '@ngrx/store';
import dayjs from 'dayjs';
import { NotificationsActions } from '../../../@shared/data/actions/notifications.actions';
import { ItemDialogService } from '../../../@shared/data/item-lists/item-dialog.service';
import { BaseListPageFacade } from '../../../@shared/data/item-lists/list-page.facade.base';
import { TodayService } from '../../../@shared/data/services/today.service';
import { CASH_SCHEDULES_LIST_ID } from '../../model/cash.types';
import {
  CashSchedule,
  ScheduleAmountChange,
  ScheduleDueStatus,
} from '../../model/schedule.types';
import { CashTransaction } from '../../model/transaction.types';
import { createCashSchedule } from '../../util/cash.factory';
import { scheduleFrom } from '../../util/derive.utils';
import {
  advanced,
  confirmedThisMonthCents,
  dueStatus,
  dueThisMonthCents,
  monthlyCommitmentCents,
  seenThisMonth,
} from '../../util/schedule.utils';
import { selectAllTransactions } from '../cash.selector';
import { CashSchedulesActions } from './cash-schedules.actions';
import {
  selectScheduleItems,
  selectSchedulesByDueDate,
  selectSchedulesSearchResult,
  selectSchedulesState,
} from './cash-schedules.selector';

@Injectable({ providedIn: 'root' })
export class CashSchedulesFacade extends BaseListPageFacade {
  readonly #store = inject(Store);
  readonly #dialogs = inject(ItemDialogService);

  readonly state = this.#store.selectSignal(selectSchedulesState);
  readonly items = this.#store.selectSignal(selectSchedulesByDueDate);
  readonly searchResult = this.#store.selectSignal(selectSchedulesSearchResult);

  readonly searchable = signal(false);
  readonly hasToolbar = signal(false);

  protected readonly commands = {
    search: (term?: string) =>
      this.#store.dispatch(CashSchedulesActions.updateSearch(term)),
  };

  readonly allItems = this.#store.selectSignal(selectScheduleItems);
  readonly #transactions = this.#store.selectSignal(selectAllTransactions);
  readonly #todayISO = inject(TodayService).today;

  readonly commitment = computed(() => ({
    monthlyCents: monthlyCommitmentCents(this.allItems()),
    dueThisMonthCents: dueThisMonthCents(this.allItems(), this.#todayISO()),
    confirmedCents: confirmedThisMonthCents(this.allItems(), this.#todayISO()),
  }));

  dueStatusOf(schedule: CashSchedule): ScheduleDueStatus {
    return dueStatus(schedule, this.#todayISO());
  }

  confirmed(schedule: CashSchedule): boolean {
    return seenThisMonth(schedule, this.#todayISO());
  }

  showCreateDialog(): void {
    this.#openCreate(createCashSchedule(''));
  }

  deriveFrom(txn: CashTransaction): void {
    this.#openCreate(scheduleFrom(txn, this.#transactions()));
  }

  #openCreate(item: CashSchedule): void {
    this.#dialogs.open({
      item,
      listId: CASH_SCHEDULES_LIST_ID,
      editMode: 'create',
    });
  }

  showEditDialog(item: CashSchedule): void {
    this.#dialogs.open({
      item,
      listId: CASH_SCHEDULES_LIST_ID,
      editMode: 'update',
    });
  }

  saveItem(item: CashSchedule): void {
    const isKnown = this.allItems().some(({ id }) => id === item.id);
    this.#store.dispatch(
      isKnown
        ? CashSchedulesActions.updateItem(item)
        : CashSchedulesActions.addItem(item)
    );
  }

  removeItem(item: CashSchedule): void {
    this.#store.dispatch(CashSchedulesActions.removeItem(item));
  }

  markSeen(schedule: CashSchedule): void {
    this.#store.dispatch(
      CashSchedulesActions.updateItem(advanced(schedule, dayjs().format()))
    );
  }

  applyAmountChanges(changes: ScheduleAmountChange[]): void {
    this.#store.dispatch(CashSchedulesActions.applyAmountChanges(changes));
  }

  reportAmountsLearned(count: number): void {
    this.#store.dispatch(
      NotificationsActions.toast({
        key: marker('cash.schedule.amounts-learned'),
        parameters: { count },
        color: 'medium',
      })
    );
  }
}
