/* ─── why ─────────────────────────────────────────────────────────
 * Marking a fixed cost seen is a BUTTON, not only a swipe: it is the one
 * action here that writes, and R5 says no action is reachable by gesture
 * alone. The swipe keeps delete, which every list in the app puts there.
 *
 * "Seen" advances the due date without touching the amount, where an import
 * does both — a cash-paid or hand-transferred commitment has no booking to
 * learn a new amount from, and guessing one would overwrite an estimate that
 * was right.
 * ───────────────────────────────────────────────────────────────── */
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import {
  AlertController,
  IonButton,
  IonButtons,
  IonIcon,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonLabel,
  IonList,
  IonListHeader,
  IonNote,
} from '@ionic/angular/standalone';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { addIcons } from 'ionicons';
import {
  add,
  checkmarkDoneOutline,
  remove,
  trashOutline,
} from 'ionicons/icons';
import { ListPageComponent } from '../../../@shared/feature/item-lists/list-page/list-page.component';
import { LIST_FACADE } from '../../../@shared/util/item-lists/list-page.facade';
import { categoryNameLookup } from '../../../@shared/util/categories/category.utils';
import { CashCategoriesFacade, CashSchedulesFacade } from '../../data';
import { CashSchedule } from '../../model/schedule.types';
import { deleteConfirmAlert } from '../../util/delete-alert.utils';
import { LocalizedDatePipe } from '../../util/formatting/localized-date.pipe';
import { MoneyEurPipe } from '../../util/formatting/money.pipe';

@Component({
  selector: 'app-page-cash-schedules',
  templateUrl: './cash-schedules.page.html',
  styleUrls: ['./cash-schedules.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ListPageComponent,
    IonButton,
    IonButtons,
    IonIcon,
    IonItem,
    IonItemSliding,
    IonItemOptions,
    IonItemOption,
    IonLabel,
    IonList,
    IonListHeader,
    IonNote,
    TranslatePipe,
    MoneyEurPipe,
    LocalizedDatePipe,
  ],
  providers: [{ provide: LIST_FACADE, useExisting: CashSchedulesFacade }],
})
export class CashSchedulesPage {
  readonly #facade = inject(CashSchedulesFacade);
  readonly #categories = inject(CashCategoriesFacade);
  readonly #alertCtrl = inject(AlertController);
  readonly #translate = inject(TranslateService);

  readonly commitment = this.#facade.commitment;

  readonly #categoryName = computed(() =>
    categoryNameLookup(this.#categories.allItems())
  );

  readonly openCents = computed(
    () => this.commitment().dueThisMonthCents - this.commitment().confirmedCents
  );

  constructor() {
    addIcons({ add, remove, checkmarkDoneOutline, trashOutline });
  }

  categoryName(schedule: CashSchedule): string {
    return schedule.categoryId
      ? this.#categoryName()(schedule.categoryId)
      : this.#translate.instant(marker('cash.schedule.no-category'));
  }

  overdue(schedule: CashSchedule): boolean {
    return this.#facade.dueStatusOf(schedule) === 'overdue';
  }

  confirmed(schedule: CashSchedule): boolean {
    return this.#facade.confirmed(schedule);
  }

  openEdit(schedule: CashSchedule): void {
    this.#facade.showEditDialog(schedule);
  }

  markSeen(schedule: CashSchedule): void {
    this.#facade.markSeen(schedule);
  }

  async confirmDelete(schedule: CashSchedule): Promise<void> {
    const alert = await this.#alertCtrl.create(
      deleteConfirmAlert(this.#translate, {
        headerKey: marker('cash.schedule.delete.header'),
        messageKey: marker('cash.schedule.delete.message'),
        messageParams: { name: schedule.name },
        onConfirm: () => this.#facade.removeItem(schedule),
      })
    );
    await alert.present();
  }
}
