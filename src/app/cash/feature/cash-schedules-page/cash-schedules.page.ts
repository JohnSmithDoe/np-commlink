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
  IonContent,
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
import { addOutline, checkmarkDoneOutline, trashOutline } from 'ionicons/icons';
import { PageHeaderComponent } from '../../../@shared/ui/page-header/page-header.component';
import { categoryNameLookup } from '../../../@shared/util/categories/category.utils';
import { CashCategoriesFacade, CashSchedulesFacade } from '../../data';
import { CashSchedule } from '../../model/schedule.types';
import { deleteConfirmAlert } from '../../util/delete-alert.utils';
import { LocalizedDatePipe } from '../../util/formatting/localized-date.pipe';
import { MoneyEurPipe } from '../../util/formatting/money.pipe';
import { EditCashScheduleDialogComponent } from '../edit-cash-schedule-dialog/edit-cash-schedule-dialog.component';

@Component({
  selector: 'app-page-cash-schedules',
  templateUrl: './cash-schedules.page.html',
  styleUrls: ['./cash-schedules.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent,
    EditCashScheduleDialogComponent,
    IonButton,
    IonButtons,
    IonContent,
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
})
export class CashSchedulesPage {
  readonly #facade = inject(CashSchedulesFacade);
  readonly #categories = inject(CashCategoriesFacade);
  readonly #alertCtrl = inject(AlertController);
  readonly #translate = inject(TranslateService);

  readonly schedules = this.#facade.ordered;
  readonly commitment = this.#facade.commitment;

  readonly #categoryName = computed(() =>
    categoryNameLookup(this.#categories.allItems())
  );

  readonly openCents = computed(
    () => this.commitment().dueThisMonthCents - this.commitment().confirmedCents
  );

  constructor() {
    addIcons({ addOutline, checkmarkDoneOutline, trashOutline });
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

  openNew(): void {
    this.#facade.showCreateDialog();
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
