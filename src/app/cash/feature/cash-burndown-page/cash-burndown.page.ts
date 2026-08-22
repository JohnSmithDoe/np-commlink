/* ─── why ─────────────────────────────────────────────────────────
 * The page shows the committed figure beside the allowance rather than only
 * the allowance, because a number that quietly withholds a third of the
 * balance reads as a bug. Naming the reserve is what makes it read as an
 * answer.
 *
 * `overspent` and `overToday` are two questions, not one. The first is "this
 * month is gone", which is what the hint below the headline says in words;
 * the second is only "today's share is used up", an ordinary Tuesday that
 * tomorrow resets. Colouring the headline off the monthly one left it calm
 * on the day it should have been red.
 *
 * Booking lives on `/cash/spending`, not here. A composer needs four controls
 * and this page is already seven figures deep, so the two together read as
 * neither an overview nor a form.
 * ───────────────────────────────────────────────────────────────── */
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import {
  IonContent,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonNote,
} from '@ionic/angular/standalone';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { PageHeaderComponent } from '../../../@shared/ui/page-header/page-header.component';
import { CashBurndownFacade } from '../../data';
import { LocalizedDatePipe } from '../../util/formatting/localized-date.pipe';
import { MoneyEurPipe } from '../../util/formatting/money.pipe';

@Component({
  selector: 'app-page-cash-burndown',
  templateUrl: './cash-burndown.page.html',
  styleUrls: ['./cash-burndown.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent,
    RouterLink,
    IonContent,
    IonItem,
    IonLabel,
    IonList,
    IonListHeader,
    IonNote,
    TranslatePipe,
    MoneyEurPipe,
    LocalizedDatePipe,
  ],
})
export class CashBurndownPage {
  readonly #facade = inject(CashBurndownFacade);

  readonly burndown = this.#facade.burndown;
  readonly overdue = this.#facade.overdue;

  readonly overspent = computed(() => this.burndown().perDayCents < 0);
  readonly overToday = computed(() => this.burndown().remainingTodayCents < 0);
  readonly scheduleCount = computed(() => this.#facade.schedules().length);
  readonly spendCount = computed(() => this.#facade.monthSpends().length);

  constructor() {
    this.#facade.refreshToday();
  }
}
