import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { Router } from '@angular/router';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonLabel,
  IonList,
  IonItem,
  IonNote,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Store } from '@ngrx/store';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, ChartConfiguration, ChartData, registerables } from 'chart.js';
import dayjs from 'dayjs';
import { addIcons } from 'ionicons';
import { arrowBackOutline } from 'ionicons/icons';
import {
  selectMonthlyTotals,
  selectReportTotals,
  selectSpendByCategory,
} from '../../data';
import { MoneyEurPipe } from '../../util/money.pipe';
import { chartColors } from '../../../@shared/util/chart-colors';

Chart.register(...registerables);

/**
 * CREDSTICK reporting (P5): total income / spend / net, income-vs-spend per
 * month, and spend by category. Transfers and reconciled-away legs are excluded
 * upstream by the reporting selectors. Charts via ng2-charts (precedent:
 * tracking/smart-ui/sessions-chart). Reached from the accounts overview header.
 */
@Component({
  selector: 'app-page-cash-report',
  templateUrl: './cash-report.page.html',
  styleUrls: ['./cash-report.page.scss'],
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
    IonLabel,
    IonIcon,
    IonNote,
    TranslateModule,
    MoneyEurPipe,
    BaseChartDirective,
  ],
})
export class CashReportPage {
  readonly #store = inject(Store);
  readonly #router = inject(Router);
  readonly #translate = inject(TranslateService);
  readonly #colors = chartColors();

  readonly totals = this.#store.selectSignal(selectReportTotals);
  readonly #monthly = this.#store.selectSignal(selectMonthlyTotals);
  readonly spendByCategory = this.#store.selectSignal(selectSpendByCategory);

  readonly hasData = computed(
    () => this.#monthly().length > 0 || this.spendByCategory().length > 0
  );

  readonly monthlyData = computed<ChartData<'bar'>>(() => {
    const months = this.#monthly();
    return {
      labels: months.map((m) => dayjs(`${m.month}-01`).format('MMM YY')),
      datasets: [
        {
          label: this.#translate.instant(marker('cash.report.income')),
          data: months.map((m) => m.incomeCents / 100),
          backgroundColor: this.#colors.income,
          borderWidth: 0,
        },
        {
          label: this.#translate.instant(marker('cash.report.spend')),
          data: months.map((m) => m.spendCents / 100),
          backgroundColor: this.#colors.spend,
          borderWidth: 0,
        },
      ],
    };
  });

  readonly categoryData = computed<ChartData<'doughnut'>>(() => {
    const cats = this.spendByCategory();
    const uncategorized = this.#translate.instant(
      marker('cash.report.uncategorized')
    );
    return {
      labels: cats.map((c) => c.category || uncategorized),
      datasets: [
        {
          data: cats.map((c) => c.cents / 100),
          backgroundColor: cats.map(
            (_, i) => this.#colors.series[i % this.#colors.series.length]
          ),
          borderWidth: 0,
        },
      ],
    };
  });

  readonly barOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { boxWidth: 12, padding: 8 } },
    },
    scales: {
      y: { beginAtZero: true, ticks: { callback: (v) => `${v} €` } },
      x: { ticks: { autoSkip: true, maxRotation: 0 } },
    },
  };

  readonly doughnutOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { boxWidth: 12, padding: 8 } },
    },
  };

  constructor() {
    addIcons({ arrowBackOutline });
  }

  goBack(): void {
    void this.#router.navigate(['/cash']);
  }
}
